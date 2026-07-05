import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { buildMessagePreview, isDeletedUserMessage } from './utils/chatPreview.js'
import { claimMessageProcessed, getChatMessage } from './stores/chatMessage.js'
import { getChatRoom, getChatRoomBatchUpdateRef } from './stores/chatRoom.js'
import {
  buildMembershipLastMessageUpdatePatch,
  getChatMembershipBatchUpdateRef,
  getChatMembershipRef,
  resolveMembershipUnreadCountForUpdate,
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

    const room = await getChatRoom(roomId)
    if (room == null) {
      logger.warn('Chat room not found for message trigger', { roomId, messageId })
      return
    }

    const messageBeforeWrite = await getChatMessage(roomId, messageId)
    if (messageBeforeWrite == null || isDeletedUserMessage(messageBeforeWrite)) {
      return
    }

    const message = messageBeforeWrite
    const preview = buildMessagePreview(message)
    const lastMessageAt = message.created_at
    const shouldApplyLastMessage = lastMessageAt >= (room.last_message_at ?? 0)

    if (shouldApplyLastMessage) {
      const roomBatch = db.batch()
      roomBatch.update(getChatRoomBatchUpdateRef(roomId), {
        last_message_preview: preview,
        last_message_at: Timestamp.fromMillis(lastMessageAt),
        updated_at: FieldValue.serverTimestamp(),
      })
      await roomBatch.commit()
    }

    const senderUserId = message.message_type === 'user' ? message.sender_user_id : undefined

    for (let i = 0; i < room.member_user_ids.length; i += MEMBERSHIP_BATCH_SIZE) {
      const messageForChunk = await getChatMessage(roomId, messageId)
      if (messageForChunk == null || isDeletedUserMessage(messageForChunk)) {
        break
      }

      const chunkPreview = buildMessagePreview(messageForChunk)
      const chunkLastMessageAt = messageForChunk.created_at

      const chunk = room.member_user_ids.slice(i, i + MEMBERSHIP_BATCH_SIZE)

      if (!shouldApplyLastMessage) {
        continue
      }

      await Promise.all(
        chunk.map(async (memberUserId) => {
          await db.runTransaction(async (transaction) => {
            const membershipRef = getChatMembershipRef(memberUserId, roomId)
            const membershipSnapshot = await transaction.get(membershipRef)
            if (!membershipSnapshot.exists) {
              return
            }

            const membership = membershipSnapshot.data()
            if (membership == null) {
              return
            }

            const patch = buildMembershipLastMessageUpdatePatch({
              membership,
              preview: chunkPreview,
              lastMessageAt: chunkLastMessageAt,
            })
            if (patch == null) {
              return
            }

            const nextUnreadCount = resolveMembershipUnreadCountForUpdate({
              membership,
              messageType: messageForChunk.message_type,
              shouldApplyLastMessage,
              memberUserId,
              senderUserId,
              lastMessageAt: chunkLastMessageAt,
            })

            transaction.update(getChatMembershipBatchUpdateRef(memberUserId, roomId), {
              ...patch,
              ...(nextUnreadCount != null ? { unread_count: nextUnreadCount } : {}),
            })
          })
        }),
      )
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
