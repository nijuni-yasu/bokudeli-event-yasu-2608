import { CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '@shokujii/common/schemas/ChatRoom.js'
import { ChatMessage, CHAT_SYSTEM_EVENT_MEMBER_JOINED } from '@shokujii/common/schemas/ChatMessage.js'

export const CHAT_LAST_MESSAGE_PREVIEW_DELETED = 'メッセージが削除されました'
export const CHAT_LAST_MESSAGE_PREVIEW_IMAGE = '画像を送信しました'

export const truncatePreview = (text: string): string => {
  return Array.from(text).slice(0, CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).join('')
}

const hasAttachments = (message: ChatMessage): boolean => {
  return message.attachments != null && message.attachments.length > 0
}

export const buildMessagePreview = (message: ChatMessage): string => {
  if (message.message_type === 'user') {
    const trimmedBody = message.body?.trim() ?? ''
    if (trimmedBody !== '') {
      return truncatePreview(trimmedBody)
    }
    if (hasAttachments(message)) {
      return CHAT_LAST_MESSAGE_PREVIEW_IMAGE
    }
    return truncatePreview('')
  }
  if (message.system_event === CHAT_SYSTEM_EVENT_MEMBER_JOINED) {
    const userName = message.system_params?.user_name ?? 'ユーザー'
    return truncatePreview(`${userName}さんが参加しました`)
  }
  return truncatePreview('システムメッセージ')
}

export const isDeletedUserMessage = (message: ChatMessage): boolean => {
  return message.message_type === 'user' && message.deleted_at != null
}

export const findEffectiveLastMessage = (messages: ChatMessage[]): ChatMessage | undefined => {
  for (const message of messages) {
    if (!isDeletedUserMessage(message)) {
      return message
    }
  }
  return undefined
}

export const resolveLastMessagePreviewFromMessages = (
  messages: ChatMessage[],
): { preview: string; lastMessageAt: number } => {
  const effective = findEffectiveLastMessage(messages)
  if (effective != null) {
    return {
      preview: buildMessagePreview(effective),
      lastMessageAt: effective.created_at,
    }
  }
  return {
    preview: CHAT_LAST_MESSAGE_PREVIEW_DELETED,
    lastMessageAt: messages[0]?.created_at ?? Date.now(),
  }
}
