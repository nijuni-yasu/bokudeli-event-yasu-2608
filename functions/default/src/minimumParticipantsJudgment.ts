import { getFirestore } from 'firebase-admin/firestore'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { MINIMUM_PARTICIPANTS_CANCEL_REASON } from '@shokujii/common/utils/minimumParticipants.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders } from './stores/memberOrder.js'
import {
  applyBulkEventCancelInTransaction,
  countUniqueOrderedUserIds,
  syncEventMembersFromOrderedInTransaction,
} from './applyBulkEventCancelInTransaction.js'

export type MinimumParticipantsJudgmentResult =
  | { kind: 'skipped' }
  | { kind: 'continued' }
  | {
      kind: 'canceled'
      canceledOrders: EventMemberOrder[]
      cancel_reason: string
    }

export async function runMinimumParticipantsJudgmentTransaction(params: {
  community_id: string
  event_id: string
  nowMillis: number
}): Promise<MinimumParticipantsJudgmentResult> {
  const { community_id, event_id, nowMillis } = params

  return getFirestore().runTransaction(async (transaction) => {
    // Firestore Transaction は write 後の read を拒否するため、read（Event / ordered / 補助金 usage）を
    // すべて済ませてから write する。applyBulkEventCancelInTransaction にも読み込み済みデータを渡す
    const tEvent = await getEventInCommunity(community_id, event_id, transaction)
    if (tEvent == null || tEvent.is_deleted) {
      throw new Error('イベントが見つかりません')
    }

    const mp = tEvent.minimum_participants
    if (mp == null || mp.enabled !== true || mp.judgment_evaluated_at != null) {
      return { kind: 'skipped' }
    }
    if (tEvent.event_status.value !== 'accepting_order') {
      return { kind: 'skipped' }
    }

    const ordered = await getOrders(community_id, event_id, 'ordered', transaction)
    const uniqueCount = countUniqueOrderedUserIds(ordered)

    const evaluatedMp = {
      ...mp,
      judgment_evaluated_at: nowMillis,
    }

    if (uniqueCount >= mp.count) {
      await syncEventMembersFromOrderedInTransaction(tEvent, ordered, transaction)
      await tEvent.updateEvent({ minimum_participants: evaluatedMp }, 'system', transaction)
      return { kind: 'continued' }
    }

    // enterprise 補助金 usage の read を含むため、members 同期（write）より先に呼ぶ
    const canceledOrders = await applyBulkEventCancelInTransaction({
      community_id,
      event_id,
      cancel_reason: MINIMUM_PARTICIPANTS_CANCEL_REASON,
      canceled_by: 'system',
      nowMillis,
      transaction,
      preloadedEvent: tEvent,
      preloadedOrdered: ordered,
    })

    if (canceledOrders == null) {
      return { kind: 'skipped' }
    }

    await syncEventMembersFromOrderedInTransaction(tEvent, ordered, transaction)
    // applyBulkEventCancelInTransaction が同一インスタンス（tEvent）を更新済みのため、
    // event_canceled 等の変更を保ったまま judgment_evaluated_at を確定できる
    await tEvent.updateEvent({ minimum_participants: evaluatedMp }, 'system', transaction)

    return {
      kind: 'canceled',
      canceledOrders,
      cancel_reason: MINIMUM_PARTICIPANTS_CANCEL_REASON,
    }
  })
}
