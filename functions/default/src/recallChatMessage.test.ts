import { describe, expect, it } from 'vitest'
import { ChatMessage } from '@shokujii/common/schemas/ChatMessage.js'
import { ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import { markChatMessageDeleted } from './stores/chatMessage.js'
import { updateMembershipLastMessage } from './stores/chatMembership.js'
import {
  CHAT_LAST_MESSAGE_PREVIEW_DELETED,
  findEffectiveLastMessage,
  resolveLastMessagePreviewFromMessages,
} from './utils/chatPreview.js'

describe('markChatMessageDeleted', () => {
  it('sets deleted fields and removes body', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      body: 'hello',
      created_at: Date.now(),
    })

    const deleted = markChatMessageDeleted(message, {
      deletedByUserId: 'user1',
      deletedDisplayName: 'テスト太郎',
    })

    expect(deleted.body).toBeUndefined()
    expect(deleted.deleted_at).toBeTypeOf('number')
    expect(deleted.deleted_by_user_id).toBe('user1')
    expect(deleted.deleted_display_name).toBe('テスト太郎')
    expect(deleted.isValidForDatabase()).toBe(true)
    if (deleted.toFirestore().message_type === 'user') {
      expect(deleted.toFirestore().body).toBeUndefined()
    }
  })
})

describe('resolveLastMessagePreviewFromMessages', () => {
  const now = Date.now()

  it('skips deleted user messages and uses previous valid message', () => {
    const deleted = new ChatMessage('msg2', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: now,
      deleted_at: now,
      deleted_by_user_id: 'user1',
      deleted_display_name: '太郎',
    })
    const previous = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user2',
      body: 'previous message',
      created_at: now - 1000,
    })

    const result = resolveLastMessagePreviewFromMessages([deleted, previous])
    expect(result.preview).toBe('previous message')
    expect(result.lastMessageAt).toBe(now - 1000)
  })

  it('uses system message when it is the latest effective message', () => {
    const system = new ChatMessage('msg1', {
      message_type: 'system',
      system_event: 'member_joined',
      system_params: { user_name: '花子' },
      created_at: now,
    })

    expect(findEffectiveLastMessage([system])?.id).toBe('msg1')
    const result = resolveLastMessagePreviewFromMessages([system])
    expect(result.preview).toBe('花子さんが参加しました')
  })

  it('returns fixed preview when all recent messages are deleted', () => {
    const deleted = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: now,
      deleted_at: now,
      deleted_by_user_id: 'user1',
      deleted_display_name: '太郎',
    })

    const result = resolveLastMessagePreviewFromMessages([deleted])
    expect(result.preview).toBe(CHAT_LAST_MESSAGE_PREVIEW_DELETED)
    expect(result.lastMessageAt).toBe(now)
  })
})

describe('recallChatMessage unread behavior', () => {
  it('does not decrement unread_count when updating last_message preview only', () => {
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      unread_count: 3,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const updated = updateMembershipLastMessage(membership, {
      preview: CHAT_LAST_MESSAGE_PREVIEW_DELETED,
      lastMessageAt: Date.now(),
    })

    expect(updated.unread_count).toBe(3)
    expect(updated.last_message_preview).toBe(CHAT_LAST_MESSAGE_PREVIEW_DELETED)
  })
})
