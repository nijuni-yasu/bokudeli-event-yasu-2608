import {
  DocumentData,
  FieldValue,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
  WriteBatch,
} from 'firebase-admin/firestore'
import { ChatRoom } from '@shokujii/common/schemas/ChatRoom.js'

class ChatRoomConverter implements FirestoreDataConverter<ChatRoom> {
  toFirestore(room: ChatRoom): DocumentData {
    return room.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatRoom {
    return new ChatRoom(snapshot.id, snapshot.data())
  }
}

const chatRoomsCollection = () => getFirestore().collection('chat_rooms')

const eventChatRoomQuery = (communityId: string, eventId: string) => {
  return chatRoomsCollection()
    .where('room_type', '==', 'event')
    .where('community_id', '==', communityId)
    .where('event_id', '==', eventId)
    .limit(1)
}

export const getChatRoomRef = (roomId: string) => {
  return chatRoomsCollection().doc(roomId).withConverter(new ChatRoomConverter())
}

/** FieldValue 系の partial update 用（withConverter 非付与）。batch / update 専用。 */
export const getChatRoomBatchUpdateRef = (roomId: string) => {
  return chatRoomsCollection().doc(roomId)
}

/** member_user_ids から uid を arrayRemove する batch 更新（RC-136: store 経由に集約）。 */
export const batchRemoveMemberFromChatRoom = (batch: WriteBatch, roomId: string, uid: string): void => {
  batch.update(getChatRoomBatchUpdateRef(roomId), {
    member_user_ids: FieldValue.arrayRemove(uid),
    updated_at: FieldValue.serverTimestamp(),
  })
}

export const getChatRoom = async (roomId: string, transaction?: Transaction): Promise<ChatRoom | undefined> => {
  const ref = getChatRoomRef(roomId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const findEventChatRoom = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<ChatRoom | undefined> => {
  const query = eventChatRoomQuery(communityId, eventId).withConverter(new ChatRoomConverter())
  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  const doc = snapshot.docs[0]
  return doc?.data()
}

export const generateChatRoomId = (): string => {
  return chatRoomsCollection().doc().id
}

export const saveChatRoom = async (room: ChatRoom, transaction?: Transaction): Promise<void> => {
  const ref = getChatRoomRef(room.id)
  if (transaction === undefined) {
    await ref.set(room, { merge: true })
  } else {
    transaction.set(ref, room, { merge: true })
  }
}

export const createEventChatRoom = (params: {
  communityId: string
  eventId: string
  title: string
  memberUserIds: string[]
  roomId?: string
}): ChatRoom => {
  const roomId = params.roomId ?? generateChatRoomId()
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
