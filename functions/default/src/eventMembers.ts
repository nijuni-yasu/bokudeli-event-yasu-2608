import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders } from './stores/memberOrder.js'

const logger = createModuleLogger('eventMembers')

export const createEventMembers = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}',
    region: 'asia-northeast1',
  },
  async (firestoreEvent) => {
    const { communityId, eventId } = firestoreEvent.params
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
