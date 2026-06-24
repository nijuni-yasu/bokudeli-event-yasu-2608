import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import {
  RecallChatMessageRequestSchema,
  type RecallChatMessageRequest,
  type RecallChatMessageResponse,
} from '@shokujii/common/apis/chat.js'
import { getChatAttachmentMessagePrefix } from '@shokujii/common/utils/storagePaths.js'
import { createModuleLogger } from './utils/logger.js'
import { getChatRoom, saveChatRoom, updateChatRoomLastMessage } from './stores/chatRoom.js'
import { getChatMembership, getChatMembershipRef, updateMembershipLastMessage } from './stores/chatMembership.js'
import {
  getChatMessage,
  listRecentChatMessages,
  markChatMessageDeleted,
  saveChatMessage,
} from './stores/chatMessage.js'
import { getUser } from './stores/user.js'
import { resolveLastMessagePreviewFromMessages } from './utils/chatPreview.js'

const logger = createModuleLogger('recallChatMessage')

const MEMBERSHIP_BATCH_SIZE = 500

export const resolveDeletedDisplayName = (userName: string | undefined | null): string => {
  return userName || 'ユーザー'
}

export const deleteChatMessageAttachmentsFromStorage = async (
  roomId: string,
  messageId: string,
  options?: { bestEffort?: boolean },
): Promise<void> => {
  const prefix = getChatAttachmentMessagePrefix(roomId, messageId)
  const bucket = getStorage().bucket()
  try {
    await bucket.deleteFiles({ prefix })
  } catch (error) {
    logger.error('Failed to delete chat attachment files from storage', { error, roomId, messageId, prefix })
    if (options?.bestEffort === true) {
      return
    }
    throw new HttpsError('internal', '添付ファイルの削除に失敗しました')
  }
}

export const recalculateRoomLastMessage = async (roomId: string): Promise<void> => {
  const room = await getChatRoom(roomId)
  if (room == null) {
    return
  }

  const messages = await listRecentChatMessages(roomId, 50)
  const { preview, lastMessageAt } = resolveLastMessagePreviewFromMessages(messages)

  const updatedRoom = updateChatRoomLastMessage(room, { preview, lastMessageAt }, { force: true })
  if (updatedRoom != null) {
    await saveChatRoom(updatedRoom)
  }

  const db = getFirestore()
  for (let i = 0; i < room.member_user_ids.length; i += MEMBERSHIP_BATCH_SIZE) {
    const chunk = room.member_user_ids.slice(i, i + MEMBERSHIP_BATCH_SIZE)
    const batch = db.batch()
    let writeCount = 0

    for (const memberUserId of chunk) {
      const membership = await getChatMembership(memberUserId, roomId)
      if (membership == null) {
        continue
      }

      const updated = updateMembershipLastMessage(membership, { preview, lastMessageAt }, { force: true })
      if (updated == null) {
        continue
      }
      const ref = getChatMembershipRef(memberUserId, roomId)
      batch.set(ref, updated, { merge: true })
      writeCount++
    }

    if (writeCount > 0) {
      await batch.commit()
    }
  }
}

export const recallChatMessage = onCall<RecallChatMessageRequest, Promise<RecallChatMessageResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null || uid === '') {
      throw new HttpsError('unauthenticated', 'ログインが必要です')
    }

    const input = RecallChatMessageRequestSchema.parse(request.data)
    const { room_id: roomId, message_id: messageId } = input

    const message = await getChatMessage(roomId, messageId)
    if (message == null) {
      throw new HttpsError('not-found', 'メッセージが見つかりません')
    }
    if (message.message_type !== 'user') {
      throw new HttpsError('failed-precondition', '取り消しできないメッセージです')
    }
    if (message.deleted_at != null) {
      throw new HttpsError('failed-precondition', 'すでに取り消されたメッセージです')
    }
    if (message.sender_user_id !== uid) {
      throw new HttpsError('permission-denied', '自分のメッセージのみ取り消せます')
    }

    const room = await getChatRoom(roomId)
    if (room == null) {
      throw new HttpsError('not-found', 'チャットルームが見つかりません')
    }
    if (!room.is_active) {
      throw new HttpsError('failed-precondition', 'このチャットは終了しています')
    }
    if (!room.member_user_ids.includes(uid)) {
      throw new HttpsError('permission-denied', 'このチャットに参加していません')
    }

    const user = await getUser(uid, false)
    const deletedDisplayName = resolveDeletedDisplayName(user?.user_name)

    const deletedMessage = markChatMessageDeleted(message, {
      deletedByUserId: uid,
      deletedDisplayName,
    })
    await saveChatMessage(roomId, deletedMessage)

    if (message.attachments != null && message.attachments.length > 0) {
      await deleteChatMessageAttachmentsFromStorage(roomId, messageId, { bestEffort: true })
    }

    const recent = await listRecentChatMessages(roomId, 1)
    const isLatest = recent[0]?.id === messageId
    if (isLatest) {
      await recalculateRoomLastMessage(roomId)
    }

    logger.info('Chat message recalled', { roomId, messageId, recalculated: isLatest })

    return { recalculated: isLatest }
  },
)
