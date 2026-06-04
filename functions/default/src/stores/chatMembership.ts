import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { CHAT_UNREAD_COUNT_MAX, ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import type { ChatRoomType } from '@shokujii/common/schemas/ChatRoom.js'

class ChatMembershipConverter implements FirestoreDataConverter<ChatMembership> {
  toFirestore(membership: ChatMembership): DocumentData {
    return membership.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatMembership {
    return new ChatMembership(snapshot.id, snapshot.data())
  }
}

const membershipsCollection = (userId: string) =>
  getFirestore().collection('users').doc(userId).collection('chat_memberships')

export const getChatMembershipRef = (userId: string, roomId: string) => {
  return membershipsCollection(userId).doc(roomId).withConverter(new ChatMembershipConverter())
}

export const getChatMembership = async (
  userId: string,
  roomId: string,
  transaction?: Transaction,
): Promise<ChatMembership | undefined> => {
  const ref = getChatMembershipRef(userId, roomId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveChatMembership = async (
  userId: string,
  membership: ChatMembership,
  transaction?: Transaction,
): Promise<void> => {
  const ref = getChatMembershipRef(userId, membership.room_id)
  if (transaction === undefined) {
    await ref.set(membership, { merge: true })
  } else {
    transaction.set(ref, membership, { merge: true })
  }
}

export const deleteChatMembership = async (
  userId: string,
  roomId: string,
  transaction?: Transaction,
): Promise<void> => {
  const ref = getChatMembershipRef(userId, roomId)
  if (transaction === undefined) {
    await ref.delete()
  } else {
    transaction.delete(ref)
  }
}

export const createEventChatMembership = (params: {
  roomId: string
  isActive: boolean
  lastMessageAt?: number
  lastMessagePreview?: string
}): ChatMembership => {
  const now = Date.now()
  const lastMessageAt = params.lastMessageAt ?? now
  return new ChatMembership(params.roomId, {
    room_id: params.roomId,
    room_type: 'event',
    is_active: params.isActive,
    unread_count: 0,
    last_message_at: lastMessageAt,
    last_message_preview: params.lastMessagePreview,
    created_at: now,
    updated_at: now,
  })
}

export const updateMembershipLastMessage = (
  membership: ChatMembership,
  params: { preview: string; lastMessageAt: number },
  options?: { force?: boolean },
): ChatMembership | null => {
  const currentLastMessageAt = membership.last_message_at ?? 0
  if (!options?.force && params.lastMessageAt < currentLastMessageAt) {
    return null
  }
  return new ChatMembership(membership.id, {
    ...membership,
    last_message_preview: params.preview,
    last_message_at: params.lastMessageAt,
    updated_at: Date.now(),
  })
}

export const incrementMembershipUnread = (membership: ChatMembership): ChatMembership => {
  const next = Math.min(CHAT_UNREAD_COUNT_MAX, membership.unread_count + 1)
  return new ChatMembership(membership.id, {
    ...membership,
    unread_count: next,
    updated_at: Date.now(),
  })
}

export const setMembershipInactive = (membership: ChatMembership): ChatMembership => {
  return new ChatMembership(membership.id, {
    ...membership,
    is_active: false,
    updated_at: Date.now(),
  })
}

export const syncMembershipFromRoom = (
  membership: ChatMembership,
  params: {
    isActive: boolean
    roomType: ChatRoomType
  },
): ChatMembership => {
  return new ChatMembership(membership.id, {
    ...membership,
    is_active: params.isActive,
    room_type: params.roomType,
    updated_at: Date.now(),
  })
}
