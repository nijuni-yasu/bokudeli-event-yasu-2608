import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { CancelOrdersRequest, CancelOrdersResponse, CancelOrdersRefundError } from '@shokujii/common/apis/stripe.js'
import { getOrdersByIds, saveOrder, getStripe, saveStripe } from './stores/memberOrder.js'
import { getEvent } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('cancelOrders')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

const STRIPE_REFUND_WINDOW_DAYS = 180
const REFUND_FAILURE_USER_MESSAGE =
  '注文のキャンセルは完了しています。返金の反映にお時間がかかる場合があります。問題が続く場合はサポートへお問い合わせください。'

export const cancelOrders = onCall<CancelOrdersRequest, Promise<CancelOrdersResponse>>(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }

    const { community_id, event_id, order_ids } = request.data

    if (
      typeof community_id !== 'string' ||
      community_id === '' ||
      typeof event_id !== 'string' ||
      event_id === '' ||
      !Array.isArray(order_ids)
    ) {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }
    if (order_ids.length === 0) {
      throw new HttpsError('invalid-argument', 'order_ids が空です')
    }
    if (new Set(order_ids).size !== order_ids.length) {
      throw new HttpsError('invalid-argument', 'order_ids に重複があります')
    }

    // event_payment・event_deadline_datetime はトランザクション中に変更されない前提のため、
    // トランザクション外で取得する（stripe.ts の createStripeCheckoutSession と同じパターン）
    const eventData = await getEvent(event_id)
    if (eventData == null || eventData.community_id !== community_id) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    const eventPayment = eventData.event_payment
    const nowMillis = DateTime.now().toMillis()
    if (eventData.event_deadline_datetime <= nowMillis) {
      throw new HttpsError('failed-precondition', '注文期限を過ぎています')
    }

    const db = getFirestore()
    const orders = await db.runTransaction(async (transaction) => {
      const fetchedOrders = await getOrdersByIds(community_id, event_id, uid, order_ids, transaction)

      if (fetchedOrders.length !== order_ids.length) {
        throw new HttpsError('not-found', '一部の注文が見つかりません')
      }

      for (const order of fetchedOrders) {
        if (order.user_id !== uid) {
          throw new HttpsError('permission-denied', '権限がありません')
        }
        if (order.community_id !== community_id || order.event_id !== event_id) {
          throw new HttpsError('invalid-argument', '注文のイベント情報が一致しません')
        }
        if (order.status !== 'ordered') {
          throw new HttpsError(
            'failed-precondition',
            `注文 ${order.id} のステータスが ordered ではありません: ${order.status}`,
          )
        }
      }

      if (eventPayment === 'user_advance') {
        const missingStripeId = fetchedOrders.find((o) => o.stripe_id == null)
        if (missingStripeId != null) {
          throw new HttpsError('failed-precondition', `注文 ${missingStripeId.id} に stripe_id がありません`)
        }
      }

      for (const order of fetchedOrders) {
        order.status = 'canceled'
        order.canceled_at = nowMillis
        await saveOrder(community_id, event_id, uid, order, transaction)
      }

      return fetchedOrders
    })

    const canceledCount = orders.length

    if (eventPayment !== 'user_advance') {
      logger.info('Orders canceled (no refund)', {
        communityId: community_id,
        eventId: event_id,
        userId: uid,
        canceledCount,
        eventPayment,
      })
      return { canceled_count: canceledCount, refunds: [] }
    }

    // Stripe 返金（user_advance のみ。トランザクション外で実行）
    // stripe_id はトランザクション内で全 order に存在することを検証済み
    const stripeIdGroups = new Map<string, typeof orders>()
    for (const order of orders) {
      const sid = order.stripe_id ?? ''
      const group = stripeIdGroups.get(sid)
      if (group != null) {
        group.push(order)
      } else {
        stripeIdGroups.set(sid, [order])
      }
    }

    const stripe = new Stripe(STRIPE_API_KEY.value(), { apiVersion: '2022-11-15', maxNetworkRetries: 3 })
    const refunds: CancelOrdersResponse['refunds'] = []
    const refundErrors: CancelOrdersRefundError[] = []

    for (const [stripeId, groupOrders] of stripeIdGroups) {
      try {
        const stripeDocPre = await getStripe(community_id, event_id, stripeId)
        if (stripeDocPre == null) {
          throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
        }

        const refundAmount = groupOrders.reduce((sum, o) => sum + o.menu_price, 0)
        const existingRefundTotalPre = stripeDocPre.refunds.reduce((sum, r) => sum + r.amount, 0)
        if (existingRefundTotalPre + refundAmount > stripeDocPre.pay_amount) {
          throw new Error(
            `返金累計額が決済額を超えます: existing=${existingRefundTotalPre} + new=${refundAmount} > pay_amount=${stripeDocPre.pay_amount}`,
          )
        }

        const daysSincePayment = DateTime.now().diff(DateTime.fromMillis(stripeDocPre.created_at), 'days').days
        if (daysSincePayment > STRIPE_REFUND_WINDOW_DAYS) {
          throw new Error('返金期限を超過しています。運営にお問い合わせください')
        }

        const sortedOrderIds = groupOrders.map((o) => o.id).sort()
        const idempotencyKey = `refund_${stripeId}_${sortedOrderIds.join('_')}`

        const refund = await stripe.refunds.create(
          { payment_intent: stripeDocPre.payment_intent, amount: refundAmount },
          { idempotencyKey },
        )

        await db.runTransaction(async (transaction) => {
          const stripeDoc = await getStripe(community_id, event_id, stripeId, transaction)
          if (stripeDoc == null) {
            throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
          }
          if (stripeDoc.refunds.some((r) => r.refund_id === refund.id)) {
            return
          }
          const existingRefundTotal = stripeDoc.refunds.reduce((sum, r) => sum + r.amount, 0)
          if (existingRefundTotal + refundAmount > stripeDoc.pay_amount) {
            throw new Error(
              `返金累計額が決済額を超えます: existing=${existingRefundTotal} + new=${refundAmount} > pay_amount=${stripeDoc.pay_amount}`,
            )
          }
          stripeDoc.refunds.push({
            refund_id: refund.id,
            amount: refundAmount,
            order_ids: sortedOrderIds,
            created_at: nowMillis,
          })
          await saveStripe(community_id, event_id, stripeDoc, transaction)
        })

        refunds.push({
          stripe_id: stripeId,
          refund_id: refund.id,
          amount: refundAmount,
        })

        logger.info('Stripe refund succeeded', {
          stripeId,
          refundId: refund.id,
          amount: refundAmount,
          orderIds: sortedOrderIds,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error('Stripe refund failed', {
          stripeId,
          orderIds: groupOrders.map((o) => o.id),
          error: message,
        })
        refundErrors.push({ stripe_id: stripeId, message })
      }
    }

    const response: CancelOrdersResponse = {
      canceled_count: canceledCount,
      refunds,
    }
    if (refundErrors.length > 0) {
      response.refund_errors = refundErrors
      response.user_message = REFUND_FAILURE_USER_MESSAGE
    }

    logger.info('cancelOrders completed', {
      communityId: community_id,
      eventId: event_id,
      userId: uid,
      canceledCount,
      refundsCount: refunds.length,
      refundErrorsCount: refundErrors.length,
    })

    return response
  },
)
