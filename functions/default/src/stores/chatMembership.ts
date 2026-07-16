import {
  DocumentData,
  FieldValue,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore'
import { CHAT_UNREAD_COUNT_MAX, ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import type { ChatRoomType } from '@shokujii/common/schemas/ChatRoom.js'
import { sanitizeLastMessagePreviewField } from '@shokujii/common/utils/chatLastMessagePreview.js'

class ChatMembershipConverter implements FirestoreDataConverter<ChatMembership> {
  toFirestore(membership: ChatMembership): DocumentData {
    return membership.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatMembership {
    const raw = snapshot.data()
    return new ChatMembership(snapshot.id, {
      ...raw,
      last_message_preview: sanitizeLastMessagePreviewField(raw.last_message_preview),
    })
  }
}

const membershipsCollection = (userId: string) =>
  getFirestore().collection('users').doc(userId).collection('chat_memberships')

export const getChatMembershipRef = (userId: string, roomId: string) => {
  return membershipsCollection(userId).doc(roomId).withConverter(new ChatMembershipConverter())
}

/** FieldValue 系の partial update 用（withConverter 非付与）。batch / update 専用。 */
export const getChatMembershipBatchUpdateRef = (userId: string, roomId: string) => {
  return membershipsCollection(userId).doc(roomId)
}

export type MembershipLastMessageUpdatePatch = {
  last_message_preview: string
  last_message_at: Timestamp
  updated_at: FieldValue
}

/** unread_count 加算後の値。上限到達時は undefined（フィールド更新なし）。 */
export const computeClampedUnreadCount = (currentUnreadCount: number): number | undefined => {
  if (currentUnreadCount >= CHAT_UNREAD_COUNT_MAX) {
    return undefined
  }
  return Math.min(CHAT_UNREAD_COUNT_MAX, currentUnreadCount + 1)
}

export const resolveMembershipUnreadCountForUpdate = (params: {
  membership: ChatMembership
  messageType: 'user' | 'system'
  shouldApplyLastMessage: boolean
  memberUserId: string
  senderUserId: string | undefined
  lastMessageAt: number
}): number | undefined => {
  if (
    !shouldIncrementMembershipUnread({
      messageType: params.messageType,
      shouldApplyLastMessage: params.shouldApplyLastMessage,
      memberUserId: params.memberUserId,
      senderUserId: params.senderUserId,
      membershipLastMessageAt: params.membership.last_message_at,
      lastReadAt: params.membership.last_read_at,
      lastMessageAt: params.lastMessageAt,
    })
  ) {
    return undefined
  }
  return computeClampedUnreadCount(params.membership.unread_count)
}

export const buildMembershipLastMessageUpdatePatch = (params: {
  membership: ChatMembership
  preview: string
  lastMessageAt: number
}): MembershipLastMessageUpdatePatch | null => {
  const updated = updateMembershipLastMessage(params.membership, {
    preview: params.preview,
    lastMessageAt: params.lastMessageAt,
  })
  if (updated == null) {
    return null
  }

  const patch: MembershipLastMessageUpdatePatch = {
    last_message_preview: params.preview,
    last_message_at: Timestamp.fromMillis(params.lastMessageAt),
    updated_at: FieldValue.serverTimestamp(),
  }

  return patch
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
  communityId: string
  eventId: string
  isActive: boolean
  lastMessageAt?: number
  lastMessagePreview?: string
}): ChatMembership => {
  const now = Date.now()
  const lastMessageAt = params.lastMessageAt ?? now
  return new ChatMembership(params.roomId, {
    room_id: params.roomId,
    room_type: 'event',
    community_id: params.communityId,
    event_id: params.eventId,
    is_active: params.isActive,
    unread_count: 0,
    last_message_at: lastMessageAt,
    last_message_preview: params.lastMessagePreview,
    created_at: now,
    updated_at: now,
  })
}

export const listChatMembershipsForUser = async (userId: string): Promise<ChatMembership[]> => {
  const snapshot = await membershipsCollection(userId).withConverter(new ChatMembershipConverter()).get()
  return snapshot.docs.map((doc) => doc.data())
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

export const shouldIncrementMembershipUnread = (params: {
  messageType: 'user' | 'system'
  shouldApplyLastMessage: boolean
  memberUserId: string
  senderUserId: string | undefined
  membershipLastMessageAt: number | undefined
  lastReadAt: number | undefined
  lastMessageAt: number
}): boolean => {
  if (params.messageType !== 'user' || !params.shouldApplyLastMessage) {
    return false
  }
  if (params.memberUserId === params.senderUserId) {
    return false
  }
  if ((params.membershipLastMessageAt ?? 0) >= params.lastMessageAt) {
    return false
  }
  if (params.lastReadAt != null && params.lastReadAt >= params.lastMessageAt) {
    return false
  }
  return true
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
