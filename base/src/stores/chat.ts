import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject, ref as storageRef } from 'firebase/storage'
import { ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import {
  ChatMessage,
  CHAT_ATTACHMENT_MAX_BYTE_SIZE,
  CHAT_MESSAGE_BODY_MAX_LENGTH,
  type ChatAttachment,
  type ChatAttachmentImageMimeType,
} from '@shokujii/common/schemas/ChatMessage.js'
import { ChatRoom } from '@shokujii/common/schemas/ChatRoom.js'
import { EpochMillisSchema } from '@shokujii/common/schemas/firebase/index.js'
import { getChatAttachmentStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { recallChatMessage as callRecallChatMessage } from '@shokujii/base/apis/chat.js'
import { db, storage } from '@shokujii/base/firebase.js'
import { isAllowedChatAttachmentMimeType, uploadChatAttachment } from '../utils/storage.js'
import type { ChatActiveRoom, ChatMessageItem, ChatRoomListItem } from '../components/chat/types.js'
import {
  resolveEventIdsFromRoomId,
  subscribeEventRoomDisplay,
  unsubscribeAllEventRoomDisplays,
  type RoomDisplayMeta,
} from './chatRoomDisplay.js'

const MESSAGES_PAGE_SIZE = 50

/** serverTimestamp() 確定前のローカルスナップショットなど、パース不能な値は除外する */
const parseOptionalEpochMillis = (value: unknown): number | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  const result = EpochMillisSchema.safeParse(value)
  return result.success ? result.data : undefined
}

const parseEpochMillisOrDefault = (value: unknown, defaultValue: number): number => {
  const result = EpochMillisSchema.safeParse(value)
  return result.success ? result.data : defaultValue
}

const membershipFromFirestore = (snapshot: QueryDocumentSnapshot): ChatMembership => {
  const raw = snapshot.data()
  const now = Date.now()
  return new ChatMembership(snapshot.id, {
    ...raw,
    created_at: parseEpochMillisOrDefault(raw.created_at, now),
    updated_at: parseEpochMillisOrDefault(raw.updated_at, now),
    last_read_at: parseOptionalEpochMillis(raw.last_read_at),
    last_message_at: parseOptionalEpochMillis(raw.last_message_at),
  })
}

const messageFromFirestore = (snapshot: QueryDocumentSnapshot): ChatMessage => {
  const raw = snapshot.data()
  return new ChatMessage(snapshot.id, {
    ...raw,
    created_at: parseEpochMillisOrDefault(raw.created_at, Date.now()),
    deleted_at: parseOptionalEpochMillis(raw.deleted_at),
  })
}

const chatRoomConverter: FirestoreDataConverter<ChatRoom> = {
  toFirestore(room: ChatRoom): DocumentData {
    return room.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatRoom {
    return new ChatRoom(snapshot.id, snapshot.data())
  },
}

const chatMessageConverter: FirestoreDataConverter<ChatMessage> = {
  toFirestore(message: ChatMessage): DocumentData {
    return message.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatMessage {
    return messageFromFirestore(snapshot)
  },
}

const chatMembershipConverter: FirestoreDataConverter<ChatMembership> = {
  toFirestore(membership: ChatMembership): DocumentData {
    return membership.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatMembership {
    return membershipFromFirestore(snapshot)
  },
}

export const getChatRoomRef = (roomId: string) => {
  return doc(db, 'chat_rooms', roomId).withConverter(chatRoomConverter)
}

export const getChatMembershipRef = (userId: string, roomId: string) => {
  return doc(db, 'users', userId, 'chat_memberships', roomId).withConverter(chatMembershipConverter)
}

export const waitForMembership = (userId: string, roomId: string, timeoutMs = 10_000): Promise<boolean> => {
  return new Promise((resolve) => {
    const ref = getChatMembershipRef(userId, roomId)
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let unsubscribe: Unsubscribe | null = null

    const cleanup = (): void => {
      if (timeoutId != null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (unsubscribe != null) {
        unsubscribe()
        unsubscribe = null
      }
    }

    unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        cleanup()
        resolve(true)
      }
    })

    timeoutId = setTimeout(() => {
      cleanup()
      resolve(false)
    }, timeoutMs)
  })
}

const getMessagesCollectionRef = (roomId: string) => {
  return collection(db, 'chat_rooms', roomId, 'messages').withConverter(chatMessageConverter)
}

const toMessageItem = (message: ChatMessage): ChatMessageItem => ({
  id: message.id,
  messageType: message.message_type,
  senderUserId: message.sender_user_id,
  body: message.body,
  systemEvent: message.system_event,
  systemParams: message.system_params,
  createdAt: message.created_at,
  deletedAt: message.deleted_at,
  deletedDisplayName: message.deleted_display_name,
  attachments: message.attachments,
})

export const mergeMessages = (existing: ChatMessageItem[], incoming: ChatMessageItem[]): ChatMessageItem[] => {
  const map = new Map<string, ChatMessageItem>()
  for (const message of existing) {
    map.set(message.id, message)
  }
  for (const message of incoming) {
    map.set(message.id, message)
  }
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt)
}

export const useChatStore = defineStore('chat', () => {
  const rooms = ref<ChatRoomListItem[]>([])
  const membershipsLoaded = ref(false)
  const activeRoomId = ref<string | null>(null)
  const activeRoom = ref<ChatActiveRoom | null>(null)
  const messages = ref<ChatMessageItem[]>([])
  const isLoadingOlderMessages = ref(false)
  const hasMoreMessages = ref(true)
  const subscribedUserId = ref<string | null>(null)

  let membershipsUnsubscribe: Unsubscribe | null = null
  let roomUnsubscribe: Unsubscribe | null = null
  let messagesUnsubscribe: Unsubscribe | null = null
  let oldestMessageSnapshot: DocumentSnapshot | null = null
  let activeRoomDisplayUnsubscribe: Unsubscribe | null = null
  const roomDisplayUnsubscribes = new Map<string, Unsubscribe>()

  const totalUnreadCount = computed(() => {
    return rooms.value.reduce((sum, room) => sum + room.unreadCount, 0)
  })

  const updateRoomInList = (roomId: string, meta: RoomDisplayMeta): void => {
    rooms.value = rooms.value.map((room) => (room.roomId === roomId ? { ...room, ...meta } : room))
  }

  /** membership 更新で一覧が作り直されても、取得済みのイベント表示メタを維持する */
  const preserveRoomDisplayMeta = (
    nextRooms: ChatRoomListItem[],
    prevRooms: ChatRoomListItem[],
  ): ChatRoomListItem[] => {
    const prevById = new Map(prevRooms.map((room) => [room.roomId, room]))
    return nextRooms.map((newRoom) => {
      const prev = prevById.get(newRoom.roomId)
      if (prev?.displayTitleReady) {
        return {
          ...newRoom,
          displayTitle: prev.displayTitle,
          displayTitleReady: prev.displayTitleReady,
          coverImageUrl: prev.coverImageUrl,
        }
      }
      return newRoom
    })
  }

  const syncListRoomDisplays = (roomList: ChatRoomListItem[]): void => {
    const eventRoomIds = new Set<string>()

    for (const room of roomList) {
      if (room.roomType !== 'event' || room.communityId == null || room.eventId == null) {
        continue
      }
      eventRoomIds.add(room.roomId)
      if (roomDisplayUnsubscribes.has(room.roomId)) {
        continue
      }
      const { communityId, eventId, roomId } = room
      const unsubscribe = subscribeEventRoomDisplay(communityId, eventId, (meta) => {
        updateRoomInList(roomId, meta)
      })
      roomDisplayUnsubscribes.set(room.roomId, unsubscribe)
    }

    for (const [roomId, unsubscribe] of roomDisplayUnsubscribes) {
      if (!eventRoomIds.has(roomId)) {
        unsubscribe()
        roomDisplayUnsubscribes.delete(roomId)
      }
    }
  }

  const membershipToListItem = (membership: ChatMembership): ChatRoomListItem => {
    const base: ChatRoomListItem = {
      roomId: membership.room_id,
      roomType: membership.room_type,
      displayTitle: '',
      displayTitleReady: membership.room_type !== 'event',
      coverImageUrl: undefined,
      isActive: membership.is_active,
      unreadCount: membership.unread_count,
      lastMessageAt: membership.last_message_at,
      lastMessagePreview: membership.last_message_preview,
    }

    if (membership.room_type === 'event') {
      const parsed = resolveEventIdsFromRoomId(membership.room_id)
      if (parsed != null) {
        return { ...base, communityId: parsed.communityId, eventId: parsed.eventId }
      }
    }

    return base
  }

  const unsubscribeListRoomDisplays = (): void => {
    for (const unsubscribe of roomDisplayUnsubscribes.values()) {
      unsubscribe()
    }
    roomDisplayUnsubscribes.clear()
  }

  const unsubscribeMemberships = () => {
    membershipsUnsubscribe?.()
    membershipsUnsubscribe = null
    subscribedUserId.value = null
    unsubscribeListRoomDisplays()
    rooms.value = []
    membershipsLoaded.value = false
  }

  const unsubscribeActiveRoom = () => {
    roomUnsubscribe?.()
    roomUnsubscribe = null
    activeRoomDisplayUnsubscribe?.()
    activeRoomDisplayUnsubscribe = null
    messagesUnsubscribe?.()
    messagesUnsubscribe = null
    oldestMessageSnapshot = null
    activeRoomId.value = null
    activeRoom.value = null
    messages.value = []
  }

  const unsubscribeAll = () => {
    unsubscribeMemberships()
    unsubscribeActiveRoom()
    unsubscribeAllEventRoomDisplays()
  }

  const subscribeMemberships = (userId: string) => {
    if (subscribedUserId.value === userId && membershipsUnsubscribe != null) {
      return
    }
    membershipsUnsubscribe?.()
    if (subscribedUserId.value != null && subscribedUserId.value !== userId) {
      unsubscribeActiveRoom()
    }
    subscribedUserId.value = userId
    membershipsLoaded.value = false

    const membershipsQuery = query(
      collection(db, 'users', userId, 'chat_memberships').withConverter(chatMembershipConverter),
      orderBy('last_message_at', 'desc'),
    )

    membershipsUnsubscribe = onSnapshot(membershipsQuery, (snapshot) => {
      const nextRooms = snapshot.docs.map((docSnapshot) => membershipToListItem(docSnapshot.data()))
      rooms.value = preserveRoomDisplayMeta(nextRooms, rooms.value)
      syncListRoomDisplays(rooms.value)
      membershipsLoaded.value = true
    })
  }

  const subscribeActiveRoomDisplay = (roomId: string, communityId: string, eventId: string): void => {
    activeRoomDisplayUnsubscribe?.()
    activeRoomDisplayUnsubscribe = subscribeEventRoomDisplay(communityId, eventId, (meta) => {
      if (activeRoom.value?.roomId === roomId) {
        activeRoom.value = { ...activeRoom.value, ...meta }
      }
    })
  }

  const subscribeRoom = (roomId: string) => {
    activeRoomId.value = roomId
    roomUnsubscribe?.()
    activeRoomDisplayUnsubscribe?.()
    activeRoomDisplayUnsubscribe = null

    roomUnsubscribe = onSnapshot(getChatRoomRef(roomId), (snapshot) => {
      if (!snapshot.exists()) {
        activeRoom.value = null
        return
      }
      const room = snapshot.data()
      const parsed = room.room_type === 'event' ? resolveEventIdsFromRoomId(room.id) : null
      const communityId = parsed?.communityId ?? room.community_id
      const eventId = parsed?.eventId ?? room.event_id

      activeRoom.value = {
        roomId: room.id,
        displayTitle: '',
        displayTitleReady: room.room_type !== 'event',
        coverImageUrl: undefined,
        isActive: room.is_active,
        isReadonly: !room.is_active,
        roomType: room.room_type,
        communityId,
        eventId,
      }

      if (parsed != null) {
        subscribeActiveRoomDisplay(room.id, parsed.communityId, parsed.eventId)
      }
    })
  }

  const markAsRead = async (roomId: string, userId: string) => {
    const membershipRef = getChatMembershipRef(userId, roomId)
    await updateDoc(membershipRef, {
      unread_count: 0,
      last_read_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  }

  const subscribeMessages = (roomId: string, userId: string) => {
    messagesUnsubscribe?.()
    messages.value = []
    oldestMessageSnapshot = null
    hasMoreMessages.value = true

    const messagesQuery = query(
      getMessagesCollectionRef(roomId),
      orderBy('created_at', 'desc'),
      limit(MESSAGES_PAGE_SIZE),
    )

    messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const incoming = snapshot.docs.map((docSnapshot) => toMessageItem(docSnapshot.data())).reverse()
      messages.value = mergeMessages(messages.value, incoming)
      if (oldestMessageSnapshot == null) {
        oldestMessageSnapshot = snapshot.docs[snapshot.docs.length - 1] ?? null
        hasMoreMessages.value = snapshot.docs.length >= MESSAGES_PAGE_SIZE
      }

      if (activeRoomId.value === roomId) {
        void markAsRead(roomId, userId)
      }
    })
  }

  const loadOlderMessages = async (roomId: string) => {
    if (isLoadingOlderMessages.value || !hasMoreMessages.value || oldestMessageSnapshot == null) {
      return
    }
    isLoadingOlderMessages.value = true
    try {
      const olderQuery = query(
        getMessagesCollectionRef(roomId),
        orderBy('created_at', 'desc'),
        startAfter(oldestMessageSnapshot),
        limit(MESSAGES_PAGE_SIZE),
      )
      const snapshot = await getDocs(olderQuery)
      const incoming = snapshot.docs.map((docSnapshot) => toMessageItem(docSnapshot.data())).reverse()
      messages.value = mergeMessages(incoming, messages.value)
      oldestMessageSnapshot = snapshot.docs[snapshot.docs.length - 1] ?? oldestMessageSnapshot
      hasMoreMessages.value = snapshot.docs.length >= MESSAGES_PAGE_SIZE
    } finally {
      isLoadingOlderMessages.value = false
    }
  }

  const openRoom = (roomId: string, userId: string) => {
    subscribeRoom(roomId)
    subscribeMessages(roomId, userId)
  }

  const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = objectUrl
      })
      return { width: img.naturalWidth, height: img.naturalHeight }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const buildAttachment = async (
    roomId: string,
    messageId: string,
    imageFile: File,
    contentType: ChatAttachmentImageMimeType,
  ): Promise<ChatAttachment> => {
    const { width, height } = await getImageDimensions(imageFile)
    const attachmentId = crypto.randomUUID()
    const storagePath = getChatAttachmentStoragePath(roomId, messageId, attachmentId)
    return {
      storage_path: storagePath,
      content_type: contentType,
      file_name: imageFile.name,
      byte_size: imageFile.size,
      width,
      height,
    }
  }

  const sendMessage = async (
    roomId: string,
    userId: string,
    params: { body?: string; imageFile?: File },
  ): Promise<void> => {
    const trimmedBody = params.body?.trim() ?? ''
    const hasBody = trimmedBody !== '' && trimmedBody.length <= CHAT_MESSAGE_BODY_MAX_LENGTH
    const imageFile = params.imageFile

    if (imageFile == null) {
      if (!hasBody) {
        return
      }
      await addDoc(collection(db, 'chat_rooms', roomId, 'messages'), {
        message_type: 'user',
        sender_user_id: userId,
        body: trimmedBody,
        created_at: serverTimestamp(),
      })
      return
    }

    const contentType = imageFile.type
    if (!isAllowedChatAttachmentMimeType(contentType)) {
      throw new Error('attachment_type')
    }
    if (imageFile.size > CHAT_ATTACHMENT_MAX_BYTE_SIZE) {
      throw new Error('attachment_too_large')
    }
    if (trimmedBody.length > CHAT_MESSAGE_BODY_MAX_LENGTH) {
      return
    }

    const messagesCol = collection(db, 'chat_rooms', roomId, 'messages')
    const messageRef = doc(messagesCol)
    const messageId = messageRef.id
    const attachment = await buildAttachment(roomId, messageId, imageFile, contentType)
    let uploaded = false

    try {
      await uploadChatAttachment(imageFile, attachment.storage_path, attachment.content_type)
      uploaded = true

      const payload: Record<string, unknown> = {
        message_type: 'user',
        sender_user_id: userId,
        attachments: [attachment],
        created_at: serverTimestamp(),
      }
      if (hasBody) {
        payload.body = trimmedBody
      }
      await setDoc(messageRef, payload)
    } catch (error) {
      if (uploaded) {
        try {
          await deleteObject(storageRef(storage, attachment.storage_path))
        } catch {
          // ロールバック失敗は握りつぶす（本体エラーを優先）
        }
      }
      throw error
    }
  }

  const recallMessage = async (roomId: string, messageId: string) => {
    await callRecallChatMessage({ room_id: roomId, message_id: messageId })
  }

  return {
    rooms,
    membershipsLoaded,
    activeRoomId,
    activeRoom,
    messages,
    isLoadingOlderMessages,
    hasMoreMessages,
    totalUnreadCount,
    subscribeMemberships,
    subscribeRoom,
    subscribeMessages,
    openRoom,
    loadOlderMessages,
    sendMessage,
    recallMessage,
    markAsRead,
    unsubscribeAll,
    unsubscribeActiveRoom,
    unsubscribeMemberships,
    mergeMessages,
  }
})

export type ChatStore = ReturnType<typeof useChatStore>
