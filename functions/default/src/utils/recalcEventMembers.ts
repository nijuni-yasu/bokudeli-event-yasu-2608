import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './logger.js'
import { getEventInCommunity, type ShokujiiEvent } from '../stores/event.js'
import { getOrders } from '../stores/memberOrder.js'

const logger = createModuleLogger('recalcEventMembers')

/**
 * `status === 'ordered'` な member_orders からユーザー ID を集約し、`event.members` / `event_num_members` を更新する。
 * `updated_by` 等は触らない（`updateMembersFieldOnly` 経由）。
 */
export async function recalcEventMembers(event: ShokujiiEvent): Promise<{ updated: boolean; memberCount: number }> {
  const db = getFirestore()
  const { community_id: communityId, id: eventId } = event

  return await db.runTransaction(async (transaction) => {
    const eventData = await getEventInCommunity(communityId, eventId, transaction)
    if (eventData == null) {
      logger.warn('Event not found', { communityId, eventId })
      return { updated: false, memberCount: 0 }
    }
    if (eventData.community_id !== communityId) {
      logger.warn('Event community_id does not match, skipping update', {
        communityId,
        eventId,
        documentCommunityId: eventData.community_id,
      })
      return { updated: false, memberCount: 0 }
    }

    const orderedOrders = await getOrders(communityId, eventId, 'ordered', transaction)
    const userIds = new Set<string>()
    for (const order of orderedOrders) {
      userIds.add(order.user_id)
    }
    const newMemberIds = Array.from(userIds).sort()

    const currentSorted = [...eventData.members].sort()
    const same = currentSorted.length === newMemberIds.length && currentSorted.every((id, i) => id === newMemberIds[i])

    if (same) {
      return { updated: false, memberCount: newMemberIds.length }
    }

    await eventData.updateMembersFieldOnly(newMemberIds, transaction)
    return { updated: true, memberCount: newMemberIds.length }
  })
}
