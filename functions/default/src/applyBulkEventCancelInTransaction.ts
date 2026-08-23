import type { Transaction } from 'firebase-admin/firestore'
import type { EventMemberOrder, EventMemberOrderCancelSourceType } from '@shokujii/common/schemas/EventMemberOrder.js'
import { orderRequiresStripeIdForCancelRefund } from '@shokujii/common/utils/orderStripeRefundRequirement.js'
import { getEventInCommunity, type ShokujiiEvent } from './stores/event.js'
import { getOrders, saveOrder } from './stores/memberOrder.js'
import { createEventBulkCancelPipelineInTransaction } from './stores/eventBulkCancelPipeline.js'
import { getEventEnterpriseId, revertEnterpriseSubsidyUsageOnCancelBulk } from './utils/enterpriseSubsidyOrders.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'

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

export function countUniqueOrderedUserIds(orders: EventMemberOrder[]): number {
  return new Set(orders.map((o) => o.user_id)).size
}

export async function syncEventMembersFromOrderedInTransaction(
  event: ShokujiiEvent,
  ordered: EventMemberOrder[],
  transaction: Transaction,
): Promise<number> {
  const userIds = [...new Set(ordered.map((o) => o.user_id))].sort()
  const currentSorted = [...event.members].sort()
  const same = currentSorted.length === userIds.length && currentSorted.every((id, i) => id === userIds[i])
  if (!same) {
    await event.updateMembersFieldOnly(userIds, transaction)
  }
  return userIds.length
}

export type ApplyBulkEventCancelInTransactionParams = {
  community_id: string
  event_id: string
  cancel_reason: string
  canceled_by: string
  cancel_source: EventMemberOrderCancelSourceType
  nowMillis: number
  transaction: Transaction
  /**
   * 同一 Transaction 内で読み込み済みの Event / ordered 注文。
   * 呼び出し側が既に read している場合に渡す（Firestore Transaction は write 後の read を拒否するため、
   * write を伴う前処理の後に本関数を呼ぶ場合は必須）。省略時は本関数内で read する。
   */
  preloadedEvent?: ShokujiiEvent
  preloadedOrdered?: EventMemberOrder[]
}

/** 既に event_canceled の場合は null。それ以外は ordered を canceled にし Event を中止する。 */
export async function applyBulkEventCancelInTransaction(
  params: ApplyBulkEventCancelInTransactionParams,
): Promise<EventMemberOrder[] | null> {
  const { community_id, event_id, cancel_reason, canceled_by, cancel_source, nowMillis, transaction, preloadedEvent } =
    params

  const tEvent = preloadedEvent ?? (await getEventInCommunity(community_id, event_id, transaction))
  if (tEvent == null) {
    throw new Error('イベントが見つかりません')
  }
  if (tEvent.event_status.value === 'event_canceled') {
    return null
  }

  const eventPayment = tEvent.event_payment
  const enterpriseId = getEventEnterpriseId(tEvent)
  const eventMonth = eventPayment === 'enterprise_subsidy' ? formatYearMonth(tEvent.event_start_datetime) : null

  const ordered = params.preloadedOrdered ?? (await getOrders(community_id, event_id, 'ordered', transaction))

  for (const order of ordered) {
    if (order.status !== 'ordered') {
      throw new Error(`注文 ${order.id} のステータスが ordered ではありません: ${order.status}`)
    }
  }

  // Stripe 返金が必要な注文（user_advance / enterprise_subsidy 自己負担等）で stripe_id 欠落なら中止しない
  const ordersRequiringStripeRefund = ordered.filter((o) => orderRequiresStripeIdForCancelRefund(o, eventPayment))
  if (ordersRequiringStripeRefund.length > 0 && ordersRequiringStripeRefund.some((o) => o.stripe_id == null)) {
    throw new Error('Stripe 返金が必要な注文に決済情報（stripe_id）が紐づいていません')
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
    order.cancel_source = cancel_source
    order.canceled_by = canceled_by
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

  // 後処理（finishBulkEventCancelPostProcessing）用のスナップショット。
  // 注文は canceled になるため、再開時に事前の個別キャンセル分と区別するには中止時点の記録が必要
  await createEventBulkCancelPipelineInTransaction(
    community_id,
    event_id,
    {
      bulkCanceledOrderIds: ordered.map((o) => o.id),
      participantUserIds: [...new Set(ordered.map((o) => o.user_id))],
    },
    transaction,
  )

  return ordered
}
