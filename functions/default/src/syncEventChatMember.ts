import { getFirestore } from 'firebase-admin/firestore'
import { CHAT_SYSTEM_EVENT_MEMBER_JOINED } from '@shokujii/common/schemas/ChatMessage.js'
import { createModuleLogger } from './utils/logger.js'
import { getEventInCommunity, type ShokujiiEvent } from './stores/event.js'
import { getUser } from './stores/user.js'
import {
  buildEventRoomId,
  createEventChatRoom,
  getChatRoom,
  saveChatRoom,
  updateChatRoomMembers,
} from './stores/chatRoom.js'
import { addSystemChatMessage, saveChatMessage } from './stores/chatMessage.js'
import {
  createEventChatMembership,
  getChatMembership,
  deleteChatMembership,
  saveChatMembership,
  syncMembershipFromRoom,
} from './stores/chatMembership.js'

const logger = createModuleLogger('syncEventChatMember')

const addMemberJoinedSystemMessage = async (roomId: string, userId: string): Promise<void> => {
  const user = await getUser(userId, false)
  const userName = user?.user_name ?? 'ユーザー'
  const db = getFirestore()
  const messageId = db.collection('chat_rooms').doc(roomId).collection('messages').doc().id
  const message = addSystemChatMessage({
    roomId,
    messageId,
    systemEvent: CHAT_SYSTEM_EVENT_MEMBER_JOINED,
    systemParams: { user_name: userName },
  })
  await saveChatMessage(roomId, message)
}

const joinEventChatMember = async (event: ShokujiiEvent, userId: string): Promise<void> => {
  const { community_id: communityId, id: eventId } = event
  const roomId = buildEventRoomId(communityId, eventId)
  const title = event.event_name

  const addedUserIds = await getFirestore().runTransaction(async (transaction) => {
    // Firestore トランザクションは「すべての read を write より前」に実行する必要がある
    const existingRoom = await getChatRoom(roomId, transaction)
    const existingMembership = await getChatMembership(userId, roomId, transaction)
    const previousMemberIds = existingRoom?.member_user_ids ?? []

    let room = existingRoom
    if (room == null) {
      room = createEventChatRoom({
        communityId,
        eventId,
        title,
        memberUserIds: [userId],
      })
      await saveChatRoom(room, transaction)
    } else if (!previousMemberIds.includes(userId)) {
      room = updateChatRoomMembers(room, [...previousMemberIds, userId].sort())
      await saveChatRoom(room, transaction)
    }

    if (existingMembership == null) {
      const membershipData = createEventChatMembership({
        roomId,
        isActive: room.is_active,
        ...(existingRoom != null && existingRoom.last_message_at != null
          ? {
              lastMessageAt: existingRoom.last_message_at,
              lastMessagePreview: existingRoom.last_message_preview,
            }
          : {}),
      })
      await saveChatMembership(userId, membershipData, transaction)
    } else {
      await saveChatMembership(
        userId,
        syncMembershipFromRoom(existingMembership, {
          isActive: room.is_active,
          roomType: 'event',
        }),
        transaction,
      )
    }

    const currentMemberIds = room.member_user_ids
    return currentMemberIds.filter((id) => !previousMemberIds.includes(id))
  })

  for (const addedUserId of addedUserIds) {
    try {
      await addMemberJoinedSystemMessage(roomId, addedUserId)
    } catch (error) {
      logger.error('Failed to add member joined system message', {
        error,
        roomId,
        userId: addedUserId,
      })
    }
  }

  logger.info('Event chat member joined', { roomId, userId, addedCount: addedUserIds.length })
}

const leaveEventChatMember = async (event: ShokujiiEvent, userId: string): Promise<void> => {
  const { community_id: communityId, id: eventId } = event
  const roomId = buildEventRoomId(communityId, eventId)

  await getFirestore().runTransaction(async (transaction) => {
    const room = await getChatRoom(roomId, transaction)
    if (room == null) {
      return
    }
    if (!room.member_user_ids.includes(userId)) {
      return
    }
    const newMemberIds = room.member_user_ids.filter((id) => id !== userId)
    await saveChatRoom(updateChatRoomMembers(room, newMemberIds), transaction)
    await deleteChatMembership(userId, roomId, transaction)
  })

  logger.info('Event chat member left', { roomId, userId })
}

/**
 * 注文確定 / キャンセル後に event.members とチャットルームを同期する。
 */
export async function syncEventChatMember(params: { event: ShokujiiEvent; userId: string }): Promise<void> {
  const { event, userId } = params
  const freshEvent = await getEventInCommunity(event.community_id, event.id)
  if (freshEvent == null) {
    logger.warn('Event not found for chat sync', {
      communityId: event.community_id,
      eventId: event.id,
      userId,
    })
    return
  }

  const isArchived = freshEvent.is_deleted === true || freshEvent.event_status?.value === 'event_canceled'

  try {
    if (freshEvent.members.includes(userId)) {
      if (isArchived) {
        logger.info('Skipping event chat join for archived event', {
          communityId: event.community_id,
          eventId: event.id,
          userId,
        })
        return
      }
      await joinEventChatMember(freshEvent, userId)
    } else {
      await leaveEventChatMember(freshEvent, userId)
    }
  } catch (error) {
    logger.error('syncEventChatMember failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      communityId: event.community_id,
      eventId: event.id,
      userId,
    })
  }
}
