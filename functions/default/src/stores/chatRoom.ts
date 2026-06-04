import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { buildEventChatRoomId, ChatRoom } from '@shokujii/common/schemas/ChatRoom.js'

class ChatRoomConverter implements FirestoreDataConverter<ChatRoom> {
  toFirestore(room: ChatRoom): DocumentData {
    return room.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatRoom {
    return new ChatRoom(snapshot.id, snapshot.data())
  }
}

const chatRoomsCollection = () => getFirestore().collection('chat_rooms')

export const getChatRoomRef = (roomId: string) => {
  return chatRoomsCollection().doc(roomId).withConverter(new ChatRoomConverter())
}

export const getChatRoom = async (roomId: string, transaction?: Transaction): Promise<ChatRoom | undefined> => {
  const ref = getChatRoomRef(roomId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveChatRoom = async (room: ChatRoom, transaction?: Transaction): Promise<void> => {
  const ref = getChatRoomRef(room.id)
  if (transaction === undefined) {
    await ref.set(room, { merge: true })
  } else {
    transaction.set(ref, room, { merge: true })
  }
}

export const buildEventRoomId = (communityId: string, eventId: string): string => {
  return buildEventChatRoomId(communityId, eventId)
}

export const createEventChatRoom = (params: {
  communityId: string
  eventId: string
  title: string
  memberUserIds: string[]
}): ChatRoom => {
  const roomId = buildEventRoomId(params.communityId, params.eventId)
  return new ChatRoom(roomId, {
    room_type: 'event',
    community_id: params.communityId,
    event_id: params.eventId,
    title: params.title,
    member_user_ids: params.memberUserIds,
    is_active: true,
  })
}

export const updateChatRoomMembers = (room: ChatRoom, memberUserIds: string[]): ChatRoom => {
  return new ChatRoom(room.id, {
    ...room,
    member_user_ids: memberUserIds,
    updated_at: Date.now(),
  })
}

export const setChatRoomInactive = (room: ChatRoom): ChatRoom => {
  return new ChatRoom(room.id, {
    ...room,
    is_active: false,
    updated_at: Date.now(),
  })
}

export const updateChatRoomLastMessage = (
  room: ChatRoom,
  params: { preview: string; lastMessageAt: number },
  options?: { force?: boolean },
): ChatRoom | null => {
  const currentLastMessageAt = room.last_message_at ?? 0
  if (!options?.force && params.lastMessageAt < currentLastMessageAt) {
    return null
  }
  return new ChatRoom(room.id, {
    ...room,
    last_message_preview: params.preview,
    last_message_at: params.lastMessageAt,
    updated_at: Date.now(),
  })
}
