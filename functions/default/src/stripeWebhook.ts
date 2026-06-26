import { onRequest } from 'firebase-functions/https'
import type { Response } from 'express'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import Stripe from 'stripe'
import { EventStripe, StripeMenuType } from '@shokujii/common/schemas/EventStripe.js'
import {
  getOrdersByIds,
  saveOrder,
  getStripeByPaymentIntent,
  createStripeDoc,
  saveStripe,
} from './stores/memberOrder.js'
import { getCommunity } from './stores/community.js'
import { getEventInCommunity } from './stores/event.js'
import { applyOrderConfirmedSideEffects } from './orderConfirmedSideEffects.js'
import { writeAuditLog } from './utils/auditLog.js'
import {
  computeOrderSelfPayUnitAmount,
  getEventEnterpriseId,
  processEnterpriseSubsidyOrdersForWebhook,
} from './utils/enterpriseSubsidyOrders.js'

const logger = createModuleLogger('stripeWebhook')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const STRIPE_WEBHOOK_ENDPOINT_SECRET = defineSecret('STRIPE_WEBHOOK_ENDPOINT_SECRET')
const db = getFirestore()

/** トランザクション結果に応じてハンドラが返す HTTP を分岐する（throw による 5xx と Stripe の無限再送を避ける） */
type StripeWebhookTransactionResult =
  | {
      kind: 'processed'
      enterpriseOrderCreateLog?: {
        enterpriseId: string
        subsidyTotal: number
        totalPayment: number
        stripeDocId: string
      }
    }
  | { kind: 'noop' }
  | { kind: 'client_error'; message: string }
  | { kind: 'unrecoverable_ack'; message: string }

const HANDLED_EVENT_TYPES = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
] as const

function isHandledEventType(type: string): type is (typeof HANDLED_EVENT_TYPES)[number] {
  return (HANDLED_EVENT_TYPES as readonly string[]).includes(type)
}

/** session.payment_intent は expand 設定により string か Stripe.PaymentIntent オブジェクトのどちらにもなり得る */
function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent
  if (pi == null) return null
  if (typeof pi === 'string') return pi
  if (typeof pi === 'object' && 'id' in pi) return pi.id
  return null
}

function parseSessionContext(session: Stripe.Checkout.Session) {
  const { eventId, communityId, userId } = session.metadata ?? {}
  if (eventId == null || communityId == null || userId == null) return null

  const orderIdChunks: string[] = []
  let chunkIndex = 0
  while (session.metadata?.[`orderIds_${chunkIndex}`] != null) {
    orderIdChunks.push(session.metadata[`orderIds_${chunkIndex}`])
    chunkIndex++
  }
  const orderIds = orderIdChunks
    .join(',')
    .split(',')
    .filter((id) => id.length > 0)

  return { eventId, communityId, userId, orderIds }
}

export const stripeWebhook = onRequest(
  {
    secrets: ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_ENDPOINT_SECRET', 'SENDGRID_API_KEY'],
    // 注文確定後の副作用（コミュニティ全員への新着通知メール一括送信など）が
    // デフォルト 60 秒を超えて 504 になる事象への暫定対応（#2075 段階1）。
    // timeoutSeconds: 主目的。律速は SendGrid 等の I/O であり OOM は未観測。
    // memory: 予防的に 1GiB（並列メール送信時の余裕）。I/O 律速のため効果は限定的。
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_API_KEY.value(), {
      apiVersion: '2026-02-25.clover',
      maxNetworkRetries: 3,
    })

    let event: Stripe.Event
    try {
      const sig = req.headers['stripe-signature']
      if (sig == null) {
        res.status(400).send('Missing stripe-signature header')
        return
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_ENDPOINT_SECRET.value())
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: String(err) })
      res.status(400).send('Webhook signature verification failed')
      return
    }

    if (!isHandledEventType(event.type)) {
      logger.info('Unhandled event type, ignoring', { type: event.type })
      res.status(200).json({ received: true })
      return
    }

    const session = event.data.object as Stripe.Checkout.Session
    const ctx = parseSessionContext(session)
    if (ctx == null) {
      logger.error('Missing metadata in checkout session', { metadata: session.metadata, type: event.type })
      res.status(400).send('Missing metadata')
      return
    }
    const { eventId, communityId, userId, orderIds } = ctx

    if (orderIds.length === 0) {
      logger.error('orderIds is empty', { metadata: session.metadata })
      res.status(400).send('orderIds is empty')
      return
    }
    if (new Set(orderIds).size !== orderIds.length) {
      logger.warn('Duplicate order IDs in checkout session metadata', {
        orderIds,
        eventId,
        communityId,
        userId,
        type: event.type,
      })
      res.status(400).send('Duplicate order IDs')
      return
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      await handleAsyncPaymentFailed({ session, eventId, communityId, userId, orderIds })
      res.status(200).json({ received: true })
      return
    }

    // checkout.session.completed の unpaid (PayPay 遅延決済の初回イベント) は processing に遷移
    if (event.type === 'checkout.session.completed' && session.payment_status === 'unpaid') {
      await handleAsyncPaymentPending({ session, eventId, communityId, userId, orderIds })
      res.status(200).json({ received: true })
      return
    }

    // checkout.session.completed (paid / no_payment_required) と async_payment_succeeded は確定フロー
    await handleOrderConfirmation({ session, event, eventId, communityId, userId, orderIds, res })
  },
)

type HandlerArgs = {
  session: Stripe.Checkout.Session
  eventId: string
  communityId: string
  userId: string
  orderIds: string[]
}

/** PayPay 等の遅延決済: payment_status=unpaid。order を processing に遷移し、processing_payment_intent と processing_at を保存する */
async function handleAsyncPaymentPending(args: HandlerArgs): Promise<void> {
  const { session, eventId, communityId, userId, orderIds } = args
  const paymentIntent = getPaymentIntentId(session)
  if (paymentIntent == null) {
    logger.error('payment_intent is missing for unpaid session', { payment_intent: session.payment_intent })
    return
  }

  await db.runTransaction(async (transaction) => {
    const orders = await getOrdersByIds(communityId, eventId, userId, orderIds, transaction)
    if (orders.length !== orderIds.length) {
      logger.error('Some orders not found for async pending', {
        expected: orderIds.length,
        found: orders.length,
        paymentIntent,
      })
      return
    }

    const processingAt = Timestamp.now().toMillis()
    for (const order of orders) {
      if (order.status === 'processing' && order.processing_payment_intent === paymentIntent) continue
      if (order.failed_async_payment_intent === paymentIntent) {
        logger.info('Skip async pending: delayed completed for already-failed payment intent', {
          orderId: order.order_id,
          paymentIntent,
        })
        continue
      }
      if (order.status !== 'in_cart') {
        logger.warn('Skip processing transition for unexpected status', {
          orderId: order.order_id,
          status: order.status,
          paymentIntent,
        })
        continue
      }
      order.status = 'processing'
      order.processing_payment_intent = paymentIntent
      order.processing_at = processingAt
      order.failed_async_payment_intent = undefined
      saveOrder(communityId, eventId, userId, order, transaction)
    }
  })

  logger.info('Order set to processing (async payment pending)', {
    orderIds,
    eventId,
    communityId,
    userId,
    paymentIntent,
  })
}

/** PayPay 等の遅延決済失敗: processing → in_cart に戻し、processing_payment_intent / processing_at をクリアする */
async function handleAsyncPaymentFailed(args: HandlerArgs): Promise<void> {
  const { session, eventId, communityId, userId, orderIds } = args
  const paymentIntent = getPaymentIntentId(session)

  await db.runTransaction(async (transaction) => {
    const orders = await getOrdersByIds(communityId, eventId, userId, orderIds, transaction)
    if (orders.length !== orderIds.length) {
      logger.error('Some orders not found for async failure', {
        expected: orderIds.length,
        found: orders.length,
        paymentIntent,
      })
      return
    }

    for (const order of orders) {
      if (order.status === 'in_cart') continue
      if (order.status !== 'processing') {
        logger.warn('Skip in_cart revert for unexpected status', {
          orderId: order.order_id,
          status: order.status,
          paymentIntent,
        })
        continue
      }
      // 別の決済セッションで再 processing になっている場合は触らない
      if (
        paymentIntent != null &&
        order.processing_payment_intent != null &&
        order.processing_payment_intent !== paymentIntent
      ) {
        logger.info('Skip in_cart revert: order is processing for a newer session', {
          orderId: order.order_id,
          orderPaymentIntent: order.processing_payment_intent,
          failedPaymentIntent: paymentIntent,
        })
        continue
      }
      order.status = 'in_cart'
      order.processing_payment_intent = undefined
      order.processing_at = undefined
      if (paymentIntent != null) {
        order.failed_async_payment_intent = paymentIntent
      }
      saveOrder(communityId, eventId, userId, order, transaction)
    }
  })

  logger.info('Order reverted to in_cart (async payment failed)', {
    orderIds,
    eventId,
    communityId,
    userId,
    paymentIntent,
  })
}

/** checkout.session.completed (paid / no_payment_required) と async_payment_succeeded の確定フロー */
async function handleOrderConfirmation(args: HandlerArgs & { event: Stripe.Event; res: Response }): Promise<void> {
  const { session, event, eventId, communityId, userId, orderIds, res } = args

  // no_payment_required では payment_intent が null の可能性があるため、必須はしない
  const paymentStatus = session.payment_status
  const requirePaymentIntent = !(event.type === 'checkout.session.completed' && paymentStatus === 'no_payment_required')
  const paymentIntent = getPaymentIntentId(session)
  if (requirePaymentIntent && paymentIntent == null) {
    logger.error('payment_intent is missing for confirmation', {
      type: event.type,
      paymentStatus,
      payment_intent: session.payment_intent,
    })
    res.status(400).send('Invalid payment_intent')
    return
  }
  if (paymentIntent == null) {
    logger.info('Skipping confirmation: no payment_intent (no_payment_required)', { eventId, communityId, userId })
    res.status(200).json({ received: true })
    return
  }

  const existingStripe = await getStripeByPaymentIntent(communityId, eventId, paymentIntent)
  if (existingStripe != null) {
    // stripes は既にあるが、前回が addMember 前に失敗した場合はここで冪等に補完する（R04）。
    // createEventMembers 廃止後も、メール再送・人気イベント判定は不要なため addMember のみ残す。
    logger.info('Stripe document already exists, skipping transaction', { paymentIntent })
    const community = await getCommunity(communityId)
    if (community != null) {
      await community.addMember(userId)
    }
    res.status(200).json({ received: true })
    return
  }

  const stripeDocId = createStripeDoc(communityId, eventId)

  const txResult = await db.runTransaction(async (transaction): Promise<StripeWebhookTransactionResult> => {
    const existingInTx = await getStripeByPaymentIntent(communityId, eventId, paymentIntent, transaction)
    if (existingInTx != null) {
      logger.info('Stripe document created by concurrent request, skipping', { paymentIntent })
      return { kind: 'noop' }
    }

    const orders = await getOrdersByIds(communityId, eventId, userId, orderIds, transaction)

    if (orders.length !== orderIds.length) {
      logger.error('Some orders not found in transaction', {
        expected: orderIds.length,
        found: orders.length,
        paymentIntent,
      })
      return { kind: 'client_error', message: 'Orders not found' }
    }

    const eventData = await getEventInCommunity(communityId, eventId, transaction)
    if (eventData == null) {
      return { kind: 'client_error', message: 'Event not found' }
    }

    const enterpriseId = getEventEnterpriseId(eventData)
    let subsidyTotal = 0
    let enterpriseOrderCreateLog:
      | {
          enterpriseId: string
          subsidyTotal: number
          totalPayment: number
          stripeDocId: string
        }
      | undefined

    if (eventData.event_payment === 'enterprise_subsidy') {
      if (enterpriseId == null) {
        return { kind: 'client_error', message: 'enterprise_id is required for enterprise_subsidy' }
      }
      const subsidyResult = await processEnterpriseSubsidyOrdersForWebhook({
        enterpriseId,
        userId,
        event: eventData,
        orders,
        transaction,
      })
      if (!subsidyResult.ok) {
        return { kind: 'client_error', message: subsidyResult.message }
      }
      subsidyTotal = subsidyResult.subsidyTotal
      if (subsidyResult.enterpriseOrderCreateLog != null) {
        enterpriseOrderCreateLog = {
          ...subsidyResult.enterpriseOrderCreateLog,
          totalPayment: 0,
          stripeDocId,
        }
      }
    }

    const allAlreadyOrdered = orders.every((o) => o.status === 'ordered')
    if (allAlreadyOrdered) {
      logger.info('All orders already ordered', { paymentIntent })
      return { kind: 'noop' }
    }

    for (const order of orders) {
      if (order.status !== 'in_cart' && order.status !== 'processing' && order.status !== 'ordered') {
        logger.error('Unexpected order status for webhook', {
          orderId: order.order_id,
          status: order.status,
          paymentIntent,
        })
        return {
          kind: 'unrecoverable_ack',
          message: `Order ${order.order_id} has unexpected status: ${order.status}`,
        }
      }
    }

    const orderedAt = Timestamp.now().toMillis()
    const payAmount = orders.reduce((sum, o) => sum + computeOrderSelfPayUnitAmount(o), 0)
    if (enterpriseOrderCreateLog != null) {
      enterpriseOrderCreateLog.totalPayment = payAmount
    }
    const sessionPayCommunityBillOffAmount = orders.reduce((sum, o) => sum + (o.pay_community_bill_off_amount ?? 0), 0)

    const menusMap = new Map<string, StripeMenuType>()
    for (const order of orders) {
      const existing = menusMap.get(order.menu_id)
      if (existing) {
        existing.count++
      } else {
        menusMap.set(order.menu_id, {
          menu_name: order.menu_name,
          menu_price: order.menu_price,
          count: 1,
        })
      }
    }

    for (const order of orders) {
      if (order.status === 'ordered') continue
      order.status = 'ordered'
      order.ordered_at = orderedAt
      order.stripe_id = stripeDocId
      // 確定済み PaymentIntent は EventStripe.payment_intent が保持するため、order 側はクリアする
      order.processing_payment_intent = undefined
      order.processing_at = undefined
      order.failed_async_payment_intent = undefined
      saveOrder(communityId, eventId, userId, order, transaction)
    }

    const stripeDoc = new EventStripe(stripeDocId, {
      stripe_id: stripeDocId,
      order_ids: orderIds,
      user_id: userId,
      event_id: eventId,
      community_id: communityId,
      payment_intent: paymentIntent,
      pay_amount: payAmount,
      ...(enterpriseId != null ? { enterprise_id: enterpriseId } : {}),
      ...(subsidyTotal > 0 ? { pay_enterprise_subsidy_amount: subsidyTotal } : {}),
      ...(sessionPayCommunityBillOffAmount > 0
        ? { pay_community_bill_off_amount: sessionPayCommunityBillOffAmount }
        : {}),
      menus: Array.from(menusMap.values()),
      refunds: [],
    })
    saveStripe(communityId, eventId, stripeDoc, transaction)
    return { kind: 'processed', enterpriseOrderCreateLog }
  })

  if (txResult.kind === 'client_error') {
    res.status(400).send(txResult.message)
    return
  }
  if (txResult.kind === 'unrecoverable_ack') {
    logger.error('Webhook skipped: unrecoverable order state', {
      message: txResult.message,
      paymentIntent,
      eventId,
      communityId,
      userId,
    })
    res.status(200).json({ received: true })
    return
  }

  if (txResult.kind === 'processed') {
    if (txResult.enterpriseOrderCreateLog != null) {
      await writeAuditLog({
        enterpriseId: txResult.enterpriseOrderCreateLog.enterpriseId,
        userId,
        action: 'order_create',
        targetId: txResult.enterpriseOrderCreateLog.stripeDocId,
        targetType: 'order_session',
        details: {
          order_ids: orderIds,
          total_payment: txResult.enterpriseOrderCreateLog.totalPayment,
          pay_enterprise_subsidy_amount: txResult.enterpriseOrderCreateLog.subsidyTotal,
        },
      })
    }
    const eventForSideEffects = await getEventInCommunity(communityId, eventId)
    if (eventForSideEffects != null) {
      // 副作用完了後に 200 を返す。Stripe は約 30 秒以内の応答を期待するため、
      // 処理が長いとリトライされメール等が重複実行されうる（注文確定 TX は冪等）。
      // #2075 段階2で Cloud Tasks へ分離し、早期 200 返却へ移行予定。
      await applyOrderConfirmedSideEffects({ event: eventForSideEffects, userId })
    } else {
      logger.warn('Skipping side effects: event not found', {
        eventId,
        userId,
        paymentIntent,
      })
    }
  } else {
    // noop: 並行リクエストで先に処理済み。community メンバーのみ冪等に補完（R04 と同様）
    const community = await getCommunity(communityId)
    if (community != null) {
      await community.addMember(userId)
    }
  }

  logger.info('Webhook 処理完了', {
    type: event.type,
    paymentIntent,
    eventId,
    communityId,
    userId,
    orderCount: orderIds.length,
  })
  res.status(200).json({ received: true })
}
