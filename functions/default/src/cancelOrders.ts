import { createHash } from 'crypto'
import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { CancelOrdersRequest, CancelOrdersResponse, CancelOrdersRefundError } from '@shokujii/common/apis/stripe.js'
import { getOrdersByIds, saveOrder, getStripe, saveStripe } from './stores/memberOrder.js'
import { getEventInCommunity } from './stores/event.js'
import { applyOrderCanceledSideEffects } from './orderCanceledSideEffects.js'
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
    const eventData = await getEventInCommunity(community_id, event_id)
    if (eventData == null) {
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

      // 先払いは決済に stripe_id が紐づくのが正常。全件欠落のままキャンセル成功にすると未返金が隠れる（RC-35）。community_bill 等は未決済扱いがあり得る。
      if (eventPayment === 'user_advance' && fetchedOrders.every((o) => o.stripe_id == null)) {
        throw new HttpsError(
          'failed-precondition',
          '先払い注文に決済情報（stripe_id）が紐づいていません。サポートへお問い合わせください。',
        )
      }

      for (const order of fetchedOrders) {
        order.status = 'canceled'
        order.canceled_at = nowMillis
        await saveOrder(community_id, event_id, uid, order, transaction)
      }

      return fetchedOrders
    })

    try {
      await applyOrderCanceledSideEffects({ event: eventData, userId: uid })
    } catch (error) {
      logger.error('applyOrderCanceledSideEffects failed', {
        error,
        communityId: community_id,
        eventId: event_id,
        userId: uid,
      })
    }

    const canceledCount = orders.length

    const hasStripePayment = orders.some((o) => o.stripe_id != null)
    if (!hasStripePayment) {
      // community_bill（全額おごり等）・user_on_day は stripe なしで返金なし。user_advance+全件 stripe 欠落は上記トランザクション内で弾いている。
      logger.info('Orders canceled (no refund)', {
        communityId: community_id,
        eventId: event_id,
        userId: uid,
        canceledCount,
        eventPayment,
      })
      return { canceled_count: canceledCount, refunds: [] }
    }

    // Stripe 返金（user_advance または community_bill + discount で Stripe 決済済みの場合）
    // stripe_id なしの注文は返金対象外（同一リクエストで混在し得る）
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

    const stripe = new Stripe(STRIPE_API_KEY.value(), {
      apiVersion: '2026-02-25.clover',
      maxNetworkRetries: 3,
    })
    const refunds: CancelOrdersResponse['refunds'] = []
    const refundErrors: CancelOrdersRefundError[] = []

    for (const [stripeId, groupOrders] of stripeIdGroups) {
      try {
        if (stripeId === '') {
          continue
        }

        const stripeDocPre = await getStripe(community_id, event_id, stripeId)
        if (stripeDocPre == null) {
          throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
        }

        const refundAmount = groupOrders.reduce(
          (sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0),
          0,
        )
        if (refundAmount <= 0) {
          logger.info('Skip Stripe refund (zero or negative amount)', {
            stripeId,
            orderIds: groupOrders.map((o) => o.id),
            refundAmount,
          })
          continue
        }
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
        const orderIdsHash = createHash('sha256').update(sortedOrderIds.join('_')).digest('hex')
        const idempotencyKey = `refund_${stripeId}_${orderIdsHash}`

        const refund = await stripe.refunds.create(
          {
            payment_intent: stripeDocPre.payment_intent,
            amount: refundAmount,
            reason: 'requested_by_customer',
          },
          { idempotencyKey },
        )

        await db.runTransaction(async (transaction) => {
          const stripeDoc = await getStripe(community_id, event_id, stripeId, transaction)
          if (stripeDoc == null) {
            throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
          }
          if (stripeDoc.refunds.some((r) => r.refund_id != null && r.refund_id === refund.id)) {
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
        const errorContext: Record<string, unknown> = {
          stripeId,
          orderIds: groupOrders.map((o) => o.id),
          error: message,
        }
        if (error instanceof Stripe.errors.StripeError) {
          errorContext.stripeErrorType = error.type
          errorContext.stripeErrorCode = error.code
          errorContext.stripeRequestId = error.requestId
        }
        logger.error('Stripe refund failed', errorContext)
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
