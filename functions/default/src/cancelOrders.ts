import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { CancelOrdersRequest, CancelOrdersResponse } from '@shokujii/common/apis/stripe.js'
import { getOrdersByIds, saveOrder } from './stores/memberOrder.js'
import { getEventInCommunity } from './stores/event.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import {
  getEventEnterpriseId,
  revertEnterpriseSubsidyUsageOnCancel,
  sumEnterpriseSubsidyAmounts,
} from './utils/enterpriseSubsidyOrders.js'
import { writeAuditLog } from './utils/auditLog.js'
import { applyOrderCanceledSideEffects } from './orderCanceledSideEffects.js'
import { refundMemberOrdersStripe } from './utils/refundMemberOrdersStripe.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('cancelOrders')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

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
    const enterpriseId = getEventEnterpriseId(eventData)
    const eventMonth = eventPayment === 'enterprise_subsidy' ? formatYearMonth(eventData.event_start_datetime) : null

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

      if (eventPayment === 'enterprise_subsidy' && enterpriseId != null && eventMonth != null) {
        await revertEnterpriseSubsidyUsageOnCancel({
          enterpriseId,
          userId: uid,
          eventMonth,
          orders: fetchedOrders,
          transaction,
        })
      }

      for (const order of fetchedOrders) {
        order.status = 'canceled'
        order.canceled_at = nowMillis
        await saveOrder(community_id, event_id, uid, order, transaction)
      }

      return fetchedOrders
    })

    if (eventPayment === 'enterprise_subsidy' && enterpriseId != null) {
      const returnedSubsidy = sumEnterpriseSubsidyAmounts(orders)
      await writeAuditLog({
        enterpriseId,
        userId: uid,
        action: 'order_cancel',
        targetType: 'order_session',
        details: {
          order_ids,
          returned_subsidy_amount: returnedSubsidy,
        },
      })
    }

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

    const stripe = new Stripe(STRIPE_API_KEY.value(), {
      apiVersion: '2026-02-25.clover',
      maxNetworkRetries: 3,
    })
    const { refunds, refundErrors } = await refundMemberOrdersStripe({
      communityId: community_id,
      eventId: event_id,
      orders,
      stripe,
      nowMillis,
    })

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
