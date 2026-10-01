import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import {
  CreateStripeCheckoutSessionRequest,
  CreateStripeCheckoutSessionResponse,
} from '@shokujii/common/apis/stripe.js'
import { getEventMenuImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getUserUrl, getMainUrl, convertStoragePathToURL } from './utils/urls.js'
import { getEventInCommunity } from './stores/event.js'
import { getEnterpriseById } from './stores/enterprise.js'
import { resolveEnterpriseCheckoutOrigin } from './utils/enterpriseBaseDomain.js'
import { getOrdersByIds } from './stores/memberOrder.js'
import { createModuleLogger } from './utils/logger.js'
import {
  isPaymentCommunityBillOffAmountConsistent,
  computeTotalPayment,
} from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import { computeUserPaymentFeeFromSelfPay } from '@shokujii/common/utils/paymentUserFee.js'
import { buildUserPaymentFeeCheckoutLineItem } from './utils/paymentUserFeeStripe.js'
import { computeEnterpriseSubsidyTotalPayment } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import {
  assertActiveEnterpriseMember,
  assertEnterpriseEventPaymentAllowed,
  computeOrderSelfPayUnitAmount,
  getEventEnterpriseId,
  getStripeCheckoutLineItemGroupKey,
  loadEnterpriseMemberForSubsidy,
  syncEnterpriseSubsidyOrdersBeforeConfirm,
  writeEnterpriseSubsidyRecalculatedAudit,
} from './utils/enterpriseSubsidyOrders.js'
import { findSoldOutMenuIds, SOLD_OUT_MENU_ERROR_MESSAGE } from '@shokujii/common/utils/assertEventMenusOrderable.js'
import { assertMenuLimitsForConfirm } from './utils/menuLimitValidation.js'
import { planFormConfirmation } from './utils/formConfirm.js'
import { getFormCheckoutAttempt, saveFormCheckoutAttempt } from './stores/form.js'

const logger = createModuleLogger('stripe')
const db = getFirestore()
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const CHECKOUT_SESSION_EXPIRES_SECONDS = 31 * 60
const ORDER_IDS_CHUNK_SIZE = 20

export const createStripeCheckoutSession = onCall<
  CreateStripeCheckoutSessionRequest,
  Promise<CreateStripeCheckoutSessionResponse>
>(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const { community_id, event_id, order_ids, isPosted, origin, form_attempt_id } = request.data

    if (!community_id || !event_id || !Array.isArray(order_ids) || order_ids.length === 0) {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }

    if (new Set(order_ids).size !== order_ids.length) {
      throw new HttpsError('invalid-argument', 'order_ids に重複があります')
    }

    const uid = request.auth.uid

    const event = await getEventInCommunity(community_id, event_id)
    if (event == null) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    if (
      event.event_payment !== 'user_advance' &&
      event.event_payment !== 'community_bill' &&
      event.event_payment !== 'enterprise_subsidy'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Stripe 決済は事前クレカ決済、主催者負担割引、または福利厚生割引のイベントのみ使用できます',
      )
    }

    assertEnterpriseEventPaymentAllowed(event)
    const enterpriseId = getEventEnterpriseId(event)
    await assertActiveEnterpriseMember(enterpriseId, request.auth)

    const now = Timestamp.now().toMillis()
    if (event.event_deadline_datetime < now) {
      throw new HttpsError('failed-precondition', '注文期限を過ぎています')
    }

    if (event.members.length >= event.event_max_people) {
      throw new HttpsError('failed-precondition', '定員に達しています')
    }

    const orders = await getOrdersByIds(community_id, event_id, uid, order_ids)
    if (orders.length !== order_ids.length) {
      throw new HttpsError('not-found', '一部の注文が見つかりません')
    }

    for (const order of orders) {
      if (order.user_id !== uid) {
        throw new HttpsError('permission-denied', 'この注文にアクセスできません')
      }
      if (order.status !== 'in_cart') {
        throw new HttpsError('failed-precondition', 'カート内の注文のみ決済できます')
      }
    }

    // 早期失敗用。確定チェックは各トランザクション内でも sold_out / limit を再検証する。
    const eventMenusForSoldOutCheck = await event.getMenus()
    const soldOutMenuIds = findSoldOutMenuIds(
      eventMenusForSoldOutCheck,
      orders.map((order) => order.menu_id),
    )
    if (soldOutMenuIds.length > 0) {
      throw new HttpsError('failed-precondition', SOLD_OUT_MENU_ERROR_MESSAGE)
    }

    let checkoutOrders = orders
    let frozenFormAttemptId: string | undefined

    if (event.event_payment === 'enterprise_subsidy') {
      if (enterpriseId == null) {
        throw new HttpsError('failed-precondition', 'enterprise_id is required for enterprise_subsidy')
      }
      const { syncResult, ordersInTx } = await db.runTransaction(async (transaction) => {
        const entMember = await loadEnterpriseMemberForSubsidy(enterpriseId, uid, transaction)
        if (entMember == null) {
          throw new HttpsError('failed-precondition', '企業メンバー情報が見つかりません')
        }
        const ordersInTx = await getOrdersByIds(community_id, event_id, uid, order_ids, transaction)
        if (ordersInTx.length !== order_ids.length) {
          throw new HttpsError('not-found', '一部の注文が見つかりません')
        }
        for (const order of ordersInTx) {
          if (order.user_id !== uid) {
            throw new HttpsError('permission-denied', 'この注文にアクセスできません')
          }
          if (order.status !== 'in_cart') {
            throw new HttpsError('failed-precondition', 'カート内の注文のみ決済できます')
          }
        }
        const eventMenusInTx = await event.getMenus(transaction)
        const soldOutMenuIdsInTx = findSoldOutMenuIds(
          eventMenusInTx,
          ordersInTx.map((order) => order.menu_id),
        )
        if (soldOutMenuIdsInTx.length > 0) {
          throw new HttpsError('failed-precondition', SOLD_OUT_MENU_ERROR_MESSAGE)
        }
        await assertMenuLimitsForConfirm({
          eventId: event_id,
          eventMenus: eventMenusInTx,
          orders: ordersInTx,
          transaction,
        })
        const syncResult = await syncEnterpriseSubsidyOrdersBeforeConfirm({
          enterpriseId,
          userId: uid,
          communityId: community_id,
          eventId: event_id,
          event,
          orders: ordersInTx,
          orderIds: order_ids,
          member: entMember,
          transaction,
        })
        return { syncResult, ordersInTx }
      })
      if (syncResult.recalculated) {
        if (syncResult.recalculatedAudit != null) {
          await writeEnterpriseSubsidyRecalculatedAudit(syncResult.recalculatedAudit)
        }
        return { url: null, subsidy_recalculated: true }
      }
      checkoutOrders = ordersInTx
    } else {
      for (const order of orders) {
        if (!isPaymentCommunityBillOffAmountConsistent(event.event_payment, event.community_bill_settings, order)) {
          throw new HttpsError('failed-precondition', '割引金額が一致しません')
        }
      }

      frozenFormAttemptId = await db.runTransaction(async (transaction) => {
        const ordersInTx = await getOrdersByIds(community_id, event_id, uid, order_ids, transaction)
        if (ordersInTx.length !== order_ids.length) {
          throw new HttpsError('not-found', '一部の注文が見つかりません')
        }
        for (const order of ordersInTx) {
          if (order.user_id !== uid) {
            throw new HttpsError('permission-denied', 'この注文にアクセスできません')
          }
          if (order.status !== 'in_cart') {
            throw new HttpsError('failed-precondition', 'カート内の注文のみ決済できます')
          }
        }
        const eventMenusInTx = await event.getMenus(transaction)
        const soldOutMenuIdsInTx = findSoldOutMenuIds(
          eventMenusInTx,
          ordersInTx.map((order) => order.menu_id),
        )
        if (soldOutMenuIdsInTx.length > 0) {
          throw new HttpsError('failed-precondition', SOLD_OUT_MENU_ERROR_MESSAGE)
        }
        await assertMenuLimitsForConfirm({
          eventId: event_id,
          eventMenus: eventMenusInTx,
          orders: ordersInTx,
          transaction,
        })
        const formPlan = await planFormConfirmation({
          event,
          userId: uid,
          attemptId: form_attempt_id,
          transaction,
        })
        if (formPlan.kind === 'apply') {
          formPlan.attempt.status = 'frozen'
          await saveFormCheckoutAttempt(community_id, event_id, formPlan.attempt, transaction)
          return formPlan.attempt.id
        }
        return undefined
      })
    }

    const totalPayment =
      event.event_payment === 'enterprise_subsidy'
        ? computeEnterpriseSubsidyTotalPayment(checkoutOrders)
        : computeTotalPayment(checkoutOrders, event.event_payment, event.community_bill_settings)
    if (totalPayment <= 0) {
      throw new HttpsError('failed-precondition', '支払額が ¥0 の場合は Stripe 決済は不要です')
    }
    if (event.event_payment === 'community_bill' && event.community_bill_settings?.type !== 'discount') {
      throw new HttpsError(
        'failed-precondition',
        '主催者負担イベントで Stripe 決済できるのは割引参加（差額あり）のみです',
      )
    }

    const eventMenus = await event.getMenus()
    const menuImageMap = new Map<string, string>()
    for (const m of eventMenus) {
      menuImageMap.set(m.id, convertStoragePathToURL(getEventMenuImageStoragePath(community_id, event_id, m.menu_id)))
    }

    const grouped = new Map<string, { menuName: string; unitAmount: number; quantity: number; imageUrl: string }>()
    for (const order of checkoutOrders) {
      const unitAmount = computeOrderSelfPayUnitAmount(order)
      const groupKey = getStripeCheckoutLineItemGroupKey(event.event_payment, order)
      const existing = grouped.get(groupKey)
      if (existing) {
        existing.quantity++
      } else {
        grouped.set(groupKey, {
          menuName: order.menu_name,
          unitAmount,
          quantity: 1,
          imageUrl: menuImageMap.get(order.menu_id) ?? '',
        })
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = Array.from(grouped.values())
      .filter((item) => item.unitAmount > 0)
      .map((item) => ({
        price_data: {
          currency: 'jpy',
          tax_behavior: 'inclusive',
          product_data: {
            name: item.menuName,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
            metadata: { partner_id: event.partner_id },
          },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      }))

    if (lineItems.length === 0 && totalPayment > 0) {
      logger.error('Checkout line items empty despite positive totalPayment', {
        eventId: event_id,
        communityId: community_id,
        userId: uid,
        totalPayment,
      })
      throw new HttpsError('internal', '決済明細の生成に失敗しました')
    }

    const userFee = computeUserPaymentFeeFromSelfPay(totalPayment)
    const feeLineItem = buildUserPaymentFeeCheckoutLineItem(userFee)
    if (feeLineItem != null) {
      lineItems.push(feeLineItem)
    }

    if (lineItems.length > 100) {
      logger.warn('Checkout line items exceed Stripe limit', {
        eventId: event_id,
        communityId: community_id,
        userId: uid,
        lineItemCount: lineItems.length,
      })
      throw new HttpsError(
        'failed-precondition',
        '注文数が多すぎるため決済を開始できません。注文を分けてお試しください',
      )
    }

    const stripe = new Stripe(STRIPE_API_KEY.value(), {
      apiVersion: '2026-02-25.clover',
      maxNetworkRetries: 3,
    })
    const communityAccount = event.community_account

    let successUrl: string
    let cancelUrl: string
    if (enterpriseId != null) {
      const enterprise = await getEnterpriseById(enterpriseId)
      if (enterprise == null) {
        throw new HttpsError('failed-precondition', 'enterprise not found')
      }
      const checkoutOrigin = resolveEnterpriseCheckoutOrigin(enterprise, origin)
      successUrl = `${checkoutOrigin}/u/${uid}?eventId=${event_id}&communityAccount=${communityAccount}&isPosted=${isPosted}&session_id={CHECKOUT_SESSION_ID}`
      cancelUrl = `${checkoutOrigin}/`
    } else {
      successUrl = `${getUserUrl(uid)}?eventId=${event_id}&communityAccount=${communityAccount}&isPosted=${isPosted}&session_id={CHECKOUT_SESSION_ID}`
      cancelUrl = getMainUrl()
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: 'if_required',
      line_items: lineItems,
      mode: 'payment',
      expires_at: Math.floor(now / 1000) + CHECKOUT_SESSION_EXPIRES_SECONDS,
      metadata: {
        eventId: event_id,
        eventPayment: event.event_payment,
        communityId: community_id,
        userId: uid,
        ...(enterpriseId != null ? { enterpriseId } : {}),
        ...(frozenFormAttemptId != null ? { formAttemptId: frozenFormAttemptId } : {}),
        ...buildOrderIdChunks(order_ids),
      },
    }
    const session = await stripe.checkout.sessions.create(sessionParams)

    if (frozenFormAttemptId != null) {
      const attempt = await getFormCheckoutAttempt(community_id, event_id, frozenFormAttemptId)
      if (attempt != null) {
        attempt.stripe_session_id = session.id
        await saveFormCheckoutAttempt(community_id, event_id, attempt)
      }
    }

    logger.info('Checkout セッション作成', {
      sessionId: session.id,
      eventId: event_id,
      communityId: community_id,
      userId: uid,
      orderCount: order_ids.length,
      stripeRequest: sessionParams,
    })

    return { url: session.url }
  },
)

/**
 * order_ids を Stripe metadata の value 上限（500文字）に収まるよう分割する。
 * Stripe metadata のキー上限（50個）のうち固定キー分（最大 5 個 + enterpriseId）を除いた 44 チャンクが最大。
 */
function buildOrderIdChunks(orderIds: string[]): Record<string, string> {
  const maxChunks = 44
  const maxOrders = maxChunks * ORDER_IDS_CHUNK_SIZE
  if (orderIds.length > maxOrders) {
    throw new HttpsError('invalid-argument', `一度にチェックアウトできる注文数の上限（${maxOrders}件）を超えています`)
  }
  const chunks: Record<string, string> = {}
  for (let i = 0; i < orderIds.length; i += ORDER_IDS_CHUNK_SIZE) {
    const chunk = orderIds.slice(i, i + ORDER_IDS_CHUNK_SIZE)
    chunks[`orderIds_${i / ORDER_IDS_CHUNK_SIZE}`] = chunk.join(',')
  }
  return chunks
}
