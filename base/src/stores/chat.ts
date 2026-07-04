import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
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
  where,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject, ref as storageRef } from 'firebase/storage'
import { ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import {
  ChatAttachmentSchema,
  ChatMessage,
  CHAT_ATTACHMENT_MAX_BYTE_SIZE,
  CHAT_ATTACHMENT_MAX_COUNT,
  CHAT_MESSAGE_BODY_MAX_LENGTH,
  type ChatAttachment,
  type ChatAttachmentImageMimeType,
} from '@shokujii/common/schemas/ChatMessage.js'
import { ChatRoom } from '@shokujii/common/schemas/ChatRoom.js'
import { EpochMillisSchema } from '@shokujii/common/schemas/firebase/index.js'
import { getChatAttachmentStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { recallChatMessage as callRecallChatMessage } from '@shokujii/base/apis/chat.js'

export const CHAT_SEND_MESSAGE_ERROR = {
  attachment_count_limit: 'attachment_count_limit',
  attachment_type: 'attachment_type',
  attachment_too_large: 'attachment_too_large',
  body_too_long: 'body_too_long',
} as const

export type ChatSendMessageErrorCode = (typeof CHAT_SEND_MESSAGE_ERROR)[keyof typeof CHAT_SEND_MESSAGE_ERROR]
import { db, storage } from '@shokujii/base/firebase.js'
import { isAllowedChatAttachmentMimeType, uploadChatAttachment } from '../utils/storage.js'
import type { ChatActiveRoom, ChatMessageItem, ChatRoomListItem } from '../components/chat/types.js'
import { subscribeEventRoomDisplay, unsubscribeAllEventRoomDisplays, type RoomDisplayMeta } from './chatRoomDisplay.js'

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

const roomFromFirestore = (snapshot: QueryDocumentSnapshot): ChatRoom => {
  const raw = snapshot.data()
  const now = Date.now()
  return new ChatRoom(snapshot.id, {
    ...raw,
    created_at: parseEpochMillisOrDefault(raw.created_at, now),
    updated_at: parseEpochMillisOrDefault(raw.updated_at, now),
    last_message_at: parseOptionalEpochMillis(raw.last_message_at),
  })
}

const chatRoomConverter: FirestoreDataConverter<ChatRoom> = {
  toFirestore(room: ChatRoom): DocumentData {
    return room.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatRoom {
    return roomFromFirestore(snapshot)
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

export const waitForEventChatMembership = (
  userId: string,
  communityId: string,
  eventId: string,
  timeoutMs = 10_000,
): Promise<string | null> => {
  return new Promise((resolve) => {
    const membershipsQuery = query(
      collection(db, 'users', userId, 'chat_memberships').withConverter(chatMembershipConverter),
      where('room_type', '==', 'event'),
      where('community_id', '==', communityId),
      where('event_id', '==', eventId),
      limit(1),
    )
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

    unsubscribe = onSnapshot(membershipsQuery, (snapshot) => {
      const docSnapshot = snapshot.docs[0]
      if (docSnapshot != null) {
        cleanup()
        resolve(docSnapshot.data().room_id)
      }
    })

    timeoutId = setTimeout(() => {
      cleanup()
      resolve(null)
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
  /** ヘッダーアイコン等から一覧ドロワーを開く要求（インクリメントで通知） */
  const openChatListRequestId = ref(0)

  let membershipsUnsubscribe: Unsubscribe | null = null
  let roomUnsubscribe: Unsubscribe | null = null
  let messagesUnsubscribe: Unsubscribe | null = null
  let oldestMessageSnapshot: DocumentSnapshot | null = null
  let lastMarkedReadMaxCreatedAt = 0
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

    if (membership.room_type === 'event' && membership.community_id != null && membership.event_id != null) {
      return {
        ...base,
        communityId: membership.community_id,
        eventId: membership.event_id,
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
    lastMarkedReadMaxCreatedAt = 0
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
    activeRoom.value = null
    roomUnsubscribe?.()
    activeRoomDisplayUnsubscribe?.()
    activeRoomDisplayUnsubscribe = null

    roomUnsubscribe = onSnapshot(getChatRoomRef(roomId), (snapshot) => {
      if (!snapshot.exists()) {
        activeRoom.value = null
        return
      }
      const room = snapshot.data()
      const communityId = room.community_id
      const eventId = room.event_id

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

      if (room.room_type === 'event' && communityId != null && eventId != null) {
        subscribeActiveRoomDisplay(room.id, communityId, eventId)
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

  const tryMarkLatestMessagesAsRead = (roomId: string, userId: string): void => {
    if (activeRoomId.value !== roomId || messages.value.length === 0) {
      return
    }
    const maxCreatedAt = messages.value.reduce((max, message) => Math.max(max, message.createdAt), 0)
    if (maxCreatedAt > lastMarkedReadMaxCreatedAt) {
      lastMarkedReadMaxCreatedAt = maxCreatedAt
      void markAsRead(roomId, userId)
    }
  }

  const subscribeMessages = (roomId: string) => {
    messagesUnsubscribe?.()
    messages.value = []
    oldestMessageSnapshot = null
    lastMarkedReadMaxCreatedAt = 0
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
      if (activeRoomId.value !== roomId) {
        return
      }
      const incoming = snapshot.docs.map((docSnapshot) => toMessageItem(docSnapshot.data())).reverse()
      messages.value = mergeMessages(incoming, messages.value)
      oldestMessageSnapshot = snapshot.docs[snapshot.docs.length - 1] ?? oldestMessageSnapshot
      hasMoreMessages.value = snapshot.docs.length >= MESSAGES_PAGE_SIZE
    } finally {
      isLoadingOlderMessages.value = false
    }
  }

  const openRoom = (roomId: string) => {
    subscribeRoom(roomId)
    subscribeMessages(roomId)
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
    return ChatAttachmentSchema.parse({
      storage_path: storagePath,
      content_type: contentType,
      file_name: imageFile.name.slice(0, 255),
      byte_size: imageFile.size,
      width,
      height,
    })
  }

  const sendMessage = async (
    roomId: string,
    userId: string,
    params: { body?: string; imageFiles?: File[] },
  ): Promise<void> => {
    const trimmedBody = params.body?.trim() ?? ''
    const hasBody = trimmedBody !== '' && trimmedBody.length <= CHAT_MESSAGE_BODY_MAX_LENGTH
    const imageFiles = params.imageFiles ?? []

    if (imageFiles.length === 0) {
      if (!hasBody) {
        return
      }
      const messageRef = doc(getMessagesCollectionRef(roomId))
      const message = new ChatMessage(messageRef.id, {
        message_type: 'user',
        sender_user_id: userId,
        body: trimmedBody,
      })
      await setDoc(messageRef, message)
      return
    }

    if (imageFiles.length > CHAT_ATTACHMENT_MAX_COUNT) {
      throw new Error(CHAT_SEND_MESSAGE_ERROR.attachment_count_limit)
    }

    for (const imageFile of imageFiles) {
      if (!isAllowedChatAttachmentMimeType(imageFile.type)) {
        throw new Error(CHAT_SEND_MESSAGE_ERROR.attachment_type)
      }
      if (imageFile.size > CHAT_ATTACHMENT_MAX_BYTE_SIZE) {
        throw new Error(CHAT_SEND_MESSAGE_ERROR.attachment_too_large)
      }
    }

    if (trimmedBody.length > CHAT_MESSAGE_BODY_MAX_LENGTH) {
      throw new Error(CHAT_SEND_MESSAGE_ERROR.body_too_long)
    }

    const messageRef = doc(getMessagesCollectionRef(roomId))
    const messageId = messageRef.id
    const uploadedPaths: string[] = []
    const attachments: ChatAttachment[] = []

    try {
      for (const imageFile of imageFiles) {
        const attachment = await buildAttachment(roomId, messageId, imageFile, imageFile.type)
        await uploadChatAttachment(imageFile, attachment.storage_path, attachment.content_type)
        uploadedPaths.push(attachment.storage_path)
        attachments.push(attachment)
      }

      const message = new ChatMessage(messageId, {
        message_type: 'user',
        sender_user_id: userId,
        attachments,
        ...(hasBody ? { body: trimmedBody } : {}),
      })
      await setDoc(messageRef, message)
    } catch (error) {
      for (const storagePath of uploadedPaths) {
        try {
          await deleteObject(storageRef(storage, storagePath))
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

  const requestOpenChatList = (): void => {
    openChatListRequestId.value += 1
  }

  return {
    rooms,
    membershipsLoaded,
    activeRoomId,
    activeRoom,
    openChatListRequestId,
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
    tryMarkLatestMessagesAsRead,
    requestOpenChatList,
    unsubscribeAll,
    unsubscribeActiveRoom,
    unsubscribeMemberships,
    mergeMessages,
  }
})

export type ChatStore = ReturnType<typeof useChatStore>
