import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders, saveOrder } from './stores/memberOrder.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import {
  getEventEnterpriseId,
  revertEnterpriseSubsidyUsageOnCancelBulk,
  sumEnterpriseSubsidyAmounts,
} from './utils/enterpriseSubsidyOrders.js'
import { writeAuditLog } from './utils/auditLog.js'
import { applyOrderCanceledSideEffects } from './orderCanceledSideEffects.js'
import { refundMemberOrdersStripe } from './utils/refundMemberOrdersStripe.js'
import { sendEventBulkCancellationMails } from './eventBulkCancellationMail.js'
import { createModuleLogger } from './utils/logger.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'

const logger = createModuleLogger('cancelEventBulkCore')

export type CancelEventBulkInitiator = 'minimum_participants' | 'organizer_manual' | 'support'

export type CancelEventBulkCoreParams = {
  community_id: string
  event_id: string
  cancel_reason: string
  canceled_by: string
  initiator: CancelEventBulkInitiator
  /** minimum_participants 監査ログ用 */
  min_required?: number
  stripe: Stripe
}

export type CancelEventBulkCoreResult =
  | { outcome: 'already_canceled' }
  | {
      outcome: 'canceled'
      orderCount: number
      refundErrorsCount: number
    }

function groupOrdersByUser(orders: EventMemberOrder[]): Map<string, EventMemberOrder[]> {
  const map = new Map<string, EventMemberOrder[]>()
  for (const order of orders) {
    const list = map.get(order.user_id)
    if (list != null) {
      list.push(order)
    } else {
      map.set(order.user_id, [order])
    }
  }
  return map
}

export async function cancelEventBulkCore(params: CancelEventBulkCoreParams): Promise<CancelEventBulkCoreResult> {
  const { community_id, event_id, cancel_reason, canceled_by, initiator, min_required, stripe } = params
  const nowMillis = DateTime.now().toMillis()

  const eventBefore = await getEventInCommunity(community_id, event_id)
  if (eventBefore == null || eventBefore.is_deleted) {
    throw new Error('イベントが見つかりません')
  }

  if (eventBefore.event_status.value === 'event_canceled') {
    logger.info('cancelEventBulkCore idempotent skip', { community_id, event_id })
    return { outcome: 'already_canceled' }
  }

  const calculatedStatus = eventBefore.calculatedEventStatus
  if (calculatedStatus !== 'applying_reservation' && calculatedStatus !== 'accepting_order') {
    throw new Error(`このステータスでは一括中止できません: ${calculatedStatus}`)
  }

  await recalcEventMembers(eventBefore)

  const eventPayment = eventBefore.event_payment
  const enterpriseId = getEventEnterpriseId(eventBefore)
  const eventMonth = eventPayment === 'enterprise_subsidy' ? formatYearMonth(eventBefore.event_start_datetime) : null

  const canceledOrders = await getFirestore().runTransaction(async (transaction) => {
    const tEvent = await getEventInCommunity(community_id, event_id, transaction)
    if (tEvent == null) {
      throw new Error('イベントが見つかりません')
    }
    if (tEvent.event_status.value === 'event_canceled') {
      return null
    }

    const ordered = await getOrders(community_id, event_id, 'ordered', transaction)

    for (const order of ordered) {
      if (order.status !== 'ordered') {
        throw new Error(`注文 ${order.id} のステータスが ordered ではありません: ${order.status}`)
      }
    }

    // 先払いは全 ordered に stripe_id が必須。一部欠落のまま canceled にすると未返金が隠れる
    if (eventPayment === 'user_advance' && ordered.length > 0 && ordered.some((o) => o.stripe_id == null)) {
      throw new Error('先払い注文に決済情報（stripe_id）が紐づいていません')
    }

    if (eventPayment === 'enterprise_subsidy' && enterpriseId != null && eventMonth != null) {
      await revertEnterpriseSubsidyUsageOnCancelBulk({
        enterpriseId,
        eventMonth,
        ordersByUser: groupOrdersByUser(ordered),
        transaction,
      })
    }

    for (const order of ordered) {
      order.status = 'canceled'
      order.canceled_at = nowMillis
      await saveOrder(community_id, event_id, order.user_id, order, transaction)
    }

    await tEvent.updateEvent(
      {
        event_status: {
          value: 'event_canceled',
          shop_comment: tEvent.event_status.shop_comment,
          cancel_reason,
        },
        canceled_at: nowMillis,
        canceled_by,
      },
      canceled_by,
      transaction,
    )

    return ordered
  })

  if (canceledOrders === null) {
    return { outcome: 'already_canceled' }
  }

  const eventAfter = await getEventInCommunity(community_id, event_id)
  if (eventAfter == null) {
    throw new Error('イベント更新後の読み込みに失敗しました')
  }

  if (eventPayment === 'enterprise_subsidy' && enterpriseId != null && canceledOrders.length > 0) {
    const returnedSubsidy = sumEnterpriseSubsidyAmounts(canceledOrders)
    await writeAuditLog({
      enterpriseId,
      userId: canceled_by,
      action: 'order_cancel',
      targetType: 'order_session',
      details: {
        order_ids: canceledOrders.map((o) => o.id),
        returned_subsidy_amount: returnedSubsidy,
        bulk_event_cancel: true,
      },
    })
  }

  const userIds = [...new Set(canceledOrders.map((o) => o.user_id))]
  for (const userId of userIds) {
    try {
      await applyOrderCanceledSideEffects({ event: eventAfter, userId })
    } catch (error) {
      logger.error('applyOrderCanceledSideEffects failed', {
        error,
        community_id,
        event_id,
        userId,
      })
    }
  }

  const hasStripePayment = canceledOrders.some((o) => o.stripe_id != null)
  let refundErrorsCount = 0
  if (hasStripePayment) {
    const { refundErrors } = await refundMemberOrdersStripe({
      communityId: community_id,
      eventId: event_id,
      orders: canceledOrders,
      stripe,
      nowMillis,
    })
    refundErrorsCount = refundErrors.length
  }

  // 注文は上記トランザクションで canceled 済みのため、宛先は canceledOrders の user_id から解決する
  await sendEventBulkCancellationMails({
    event: eventAfter,
    cancelReason: cancel_reason,
    participantUserIds: userIds,
  })

  const bulkEnterpriseId = getEventEnterpriseId(eventAfter)
  if (initiator === 'minimum_participants' && bulkEnterpriseId != null) {
    await writeAuditLog({
      enterpriseId: bulkEnterpriseId,
      userId: 'system',
      action: 'event_auto_cancel',
      targetType: 'event',
      targetId: event_id,
      details: {
        order_count: canceledOrders.length,
        min_required: min_required ?? null,
      },
    })
  }

  logger.info('cancelEventBulkCore completed', {
    community_id,
    event_id,
    orderCount: canceledOrders.length,
    refundErrorsCount,
    initiator,
  })

  return { outcome: 'canceled', orderCount: canceledOrders.length, refundErrorsCount }
}
