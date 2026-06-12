import { describe, expect, it } from 'vitest'
import { RecallChatMessageRequestSchema } from '../apis/chat.js'
import { ChatMessage } from './ChatMessage.js'

describe('ChatMessage deleted fields', () => {
  it('omits body in toFirestore when message is deleted', () => {
    const deletedAt = Date.now()
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: deletedAt - 1000,
      deleted_at: deletedAt,
      deleted_by_user_id: 'user1',
      deleted_display_name: 'テストユーザー',
    })

    expect(message.isValidForDatabase()).toBe(true)
    const firestore = message.toFirestore()
    expect(firestore.message_type).toBe('user')
    if (firestore.message_type === 'user') {
      expect(firestore.body).toBeUndefined()
      expect(firestore.deleted_by_user_id).toBe('user1')
      expect(firestore.deleted_display_name).toBe('テストユーザー')
      expect(firestore.deleted_at).toBeDefined()
    }
  })

  it('requires body when deleted_at is not set', () => {
    expect(
      () =>
        new ChatMessage('msg1', {
          message_type: 'user',
          sender_user_id: 'user1',
          created_at: Date.now(),
        }),
    ).toThrow()
  })
})

describe('RecallChatMessageRequestSchema', () => {
  it('accepts valid request', () => {
    const parsed = RecallChatMessageRequestSchema.parse({
      room_id: 'event_comm_evt',
      message_id: 'msg1',
    })
    expect(parsed.room_id).toBe('event_comm_evt')
    expect(parsed.message_id).toBe('msg1')
  })

  it('rejects empty room_id or message_id', () => {
    expect(() => RecallChatMessageRequestSchema.parse({ room_id: '', message_id: 'msg1' })).toThrow()
    expect(() => RecallChatMessageRequestSchema.parse({ room_id: 'room1', message_id: '' })).toThrow()
  })
})
