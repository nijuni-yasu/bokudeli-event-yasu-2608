import type { ChatMessageType } from '@shokujii/common/schemas/ChatMessage.js'
import type { ChatRoomType } from '@shokujii/common/schemas/ChatRoom.js'

export type ChatRoomListItem = {
  roomId: string
  roomType: ChatRoomType
  displayTitle: string
  displayTitleReady: boolean
  coverImageUrl?: string
  communityId?: string
  eventId?: string
  isActive: boolean
  unreadCount: number
  lastMessageAt?: number
  lastMessagePreview?: string
}

export type ChatMessageItem = {
  id: string
  messageType: ChatMessageType
  senderUserId?: string
  body?: string
  systemEvent?: string
  systemParams?: Record<string, string>
  createdAt: number
}

export type ChatActiveRoom = {
  roomId: string
  displayTitle: string
  displayTitleReady: boolean
  coverImageUrl?: string
  isActive: boolean
  isReadonly: boolean
  roomType: ChatRoomType
  communityId?: string
  eventId?: string
}
