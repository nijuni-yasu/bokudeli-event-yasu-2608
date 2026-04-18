import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders } from './stores/memberOrder.js'
import { EventMemberOrderStatusType } from '@shokujii/common/schemas/EventMemberOrder.js'

const logger = createModuleLogger('eventMembers')

/**
 * ordered ステータスが絡む遷移かどうかを判定する。
 * event.members は ordered 注文のユーザー集合なので、
 * before/after いずれも ordered でなければ members に影響しない。
 */
const isOrderedTransition = (
  beforeStatus: EventMemberOrderStatusType | undefined,
  afterStatus: EventMemberOrderStatusType | undefined,
  beforeUserId: string | undefined,
  afterUserId: string | undefined,
): boolean => {
  if (beforeStatus !== 'ordered' && afterStatus !== 'ordered') return false
  if (beforeStatus === 'ordered' && afterStatus === 'ordered' && beforeUserId === afterUserId) return false
  return true
}

export const createEventMembers = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}',
    region: 'asia-northeast1',
  },
  async (firestoreEvent) => {
    const { communityId, eventId, userId } = firestoreEvent.params

    const beforeData = firestoreEvent.data?.before?.data()
    const afterData = firestoreEvent.data?.after?.data()
    const beforeStatus = beforeData?.status as EventMemberOrderStatusType | undefined
    const afterStatus = afterData?.status as EventMemberOrderStatusType | undefined

    // 一次ガード: ordered が絡まない変更は event.members に影響しないためスキップ
    if (!isOrderedTransition(beforeStatus, afterStatus, beforeData?.user_id, afterData?.user_id)) {
      return
    }

    const db = getFirestore()

    const result = await db.runTransaction(async (transaction) => {
      const eventData = await getEventInCommunity(communityId, eventId, transaction)
      if (eventData == null) {
        logger.warn('Event not found', { communityId, eventId })
        return { updated: false as const }
      }
      if (eventData.community_id !== communityId) {
        logger.warn('Event community_id does not match trigger path, skipping update', {
          communityId,
          eventId,
          documentCommunityId: eventData.community_id,
        })
        return { updated: false as const }
      }

      // 二次ガード: トランザクション内で members 集合への実質的な影響を判定
      const userAlreadyMember = eventData.members.includes(userId)
      if (beforeStatus !== 'ordered' && afterStatus === 'ordered' && userAlreadyMember) {
        // → ordered 遷移だが、ユーザーは既に members に含まれている（同一チェックアウトの別トリガーが先に処理済み）
        return { updated: false as const }
      }
      if (beforeStatus === 'ordered' && afterStatus !== 'ordered' && !userAlreadyMember) {
        // ordered → 非 ordered だが、ユーザーは既に members から外れている
        return { updated: false as const }
      }

      const orderedOrders = await getOrders(communityId, eventId, 'ordered', transaction)
      const userIds = new Set<string>()
      for (const order of orderedOrders) {
        userIds.add(order.user_id)
      }

      await eventData.updateMembersFieldOnly(Array.from(userIds), transaction)
      return { updated: true as const }
    })

    if (result.updated) {
      logger.info('Event members 更新', {
        communityId,
        eventId,
        orderId: firestoreEvent.params.orderId,
      })
    }
  },
)
