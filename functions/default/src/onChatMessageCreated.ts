import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { buildMessagePreview, isDeletedUserMessage } from './utils/chatPreview.js'
import { claimMessageProcessed, getChatMessage } from './stores/chatMessage.js'
import { getChatRoom, saveChatRoom, updateChatRoomLastMessage } from './stores/chatRoom.js'
import {
  getChatMembershipRef,
  incrementMembershipUnread,
  shouldIncrementMembershipUnread,
  updateMembershipLastMessage,
} from './stores/chatMembership.js'

const logger = createModuleLogger('onChatMessageCreated')

const MEMBERSHIP_BATCH_SIZE = 500

export const onChatMessageCreated = onDocumentCreated(
  { document: 'chat_rooms/{roomId}/messages/{messageId}', retry: true },
  async (event) => {
    const snapshot = event.data
    if (snapshot == null) {
      return
    }

    const roomId = event.params.roomId
    const messageId = event.params.messageId

    const db = getFirestore()

    const claimed = await db.runTransaction(async (transaction) => {
      return claimMessageProcessed(roomId, messageId, transaction)
    })

    const freshMessage = await getChatMessage(roomId, messageId)
    if (freshMessage == null || isDeletedUserMessage(freshMessage)) {
      return
    }

    const message = freshMessage
    const preview = buildMessagePreview(message)
    const lastMessageAt = message.created_at

    const room = await getChatRoom(roomId)
    if (room == null) {
      logger.warn('Chat room not found for message trigger', { roomId, messageId })
      return
    }

    const shouldApplyLastMessage = lastMessageAt >= (room.last_message_at ?? 0)

    if (shouldApplyLastMessage) {
      const updatedRoom = updateChatRoomLastMessage(room, { preview, lastMessageAt })
      if (updatedRoom != null) {
        await saveChatRoom(updatedRoom)
      }
    }

    const senderUserId = message.message_type === 'user' ? message.sender_user_id : undefined

    for (let i = 0; i < room.member_user_ids.length; i += MEMBERSHIP_BATCH_SIZE) {
      const chunk = room.member_user_ids.slice(i, i + MEMBERSHIP_BATCH_SIZE)
      // membership を並列取得して逐次 read を避ける
      const membershipRefs = chunk.map((userId) => getChatMembershipRef(userId, roomId))
      const snapshots = await Promise.all(membershipRefs.map((ref) => ref.get()))
      const batch = db.batch()
      let writeCount = 0

      for (let j = 0; j < chunk.length; j++) {
        const memberUserId = chunk[j]
        const membership = snapshots[j].exists ? snapshots[j].data() : undefined
        if (membership == null) {
          continue
        }

        if (!shouldApplyLastMessage) {
          continue
        }

        let updated = updateMembershipLastMessage(membership, { preview, lastMessageAt })
        if (updated == null) {
          continue
        }
        if (
          shouldIncrementMembershipUnread({
            messageType: message.message_type,
            shouldApplyLastMessage,
            memberUserId,
            senderUserId,
            membershipLastMessageAt: membership.last_message_at,
            lastReadAt: membership.last_read_at,
            lastMessageAt,
          })
        ) {
          updated = incrementMembershipUnread(updated)
        }

        batch.set(membershipRefs[j], updated, { merge: true })
        writeCount++
      }

      if (writeCount > 0) {
        await batch.commit()
      }
    }

    logger.info('Chat message processed', {
      roomId,
      messageId,
      messageType: message.message_type,
      claimed,
      lastMessageApplied: shouldApplyLastMessage,
    })
  },
)
