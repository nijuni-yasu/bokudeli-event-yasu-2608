import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { createModuleLogger } from './utils/logger.js'
import { archiveEventChatRoom } from './archiveChatRoom.js'

const logger = createModuleLogger('onEventArchived')

export const onEventArchived = onDocumentWritten(
  { document: 'communities/{communityId}/events/{eventId}', retry: true },
  async (event) => {
    const before = event.data?.before
    const after = event.data?.after

    if (after?.exists !== true) {
      return
    }

    const beforeDeleted = before?.get('is_deleted') === true
    const afterDeleted = after.get('is_deleted') === true
    const deletedChanged = !beforeDeleted && afterDeleted

    const beforeStatus = before?.get('event_status')?.value as string | undefined
    const afterStatus = after.get('event_status')?.value as string | undefined
    const canceledChanged = beforeStatus !== 'event_canceled' && afterStatus === 'event_canceled'

    if (!deletedChanged && !canceledChanged) {
      return
    }

    const { communityId, eventId } = event.params
    logger.info('Event archived transition detected', {
      communityId,
      eventId,
      deletedChanged,
      canceledChanged,
    })

    try {
      await archiveEventChatRoom(communityId, eventId)
    } catch (error) {
      logger.error('archiveEventChatRoom failed', {
        error,
        communityId,
        eventId,
      })
      throw error
    }
  },
)
