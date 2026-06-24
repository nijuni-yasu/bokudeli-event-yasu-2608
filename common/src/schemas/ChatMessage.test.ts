import { describe, expect, it } from 'vitest'
import { RecallChatMessageRequestSchema } from '../apis/chat.js'
import {
  CHAT_ATTACHMENT_IMAGE_MIME_TYPES,
  CHAT_ATTACHMENT_MAX_COUNT,
  ChatAttachmentSchema,
  ChatMessage,
} from './ChatMessage.js'
import { getChatAttachmentMessagePrefix, getChatAttachmentStoragePath } from '../utils/storagePaths.js'

const sampleAttachment = {
  storage_path: 'chat_rooms/room1/msg1/att1',
  content_type: CHAT_ATTACHMENT_IMAGE_MIME_TYPES[0],
  file_name: 'photo.png',
  byte_size: 1024,
  width: 800,
  height: 600,
} as const

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

  it('requires body when deleted_at is not set and attachments are empty', () => {
    expect(
      () =>
        new ChatMessage('msg1', {
          message_type: 'user',
          sender_user_id: 'user1',
          created_at: Date.now(),
        }),
    ).toThrow()
  })

  it('accepts image-only message without body', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: Date.now(),
      attachments: [sampleAttachment],
    })

    expect(message.isValidForDatabase()).toBe(true)
    const firestore = message.toFirestore()
    if (firestore.message_type === 'user') {
      expect(firestore.body).toBeUndefined()
      expect(firestore.attachments).toHaveLength(1)
      expect(firestore.attachments?.[0]?.file_name).toBe('photo.png')
    }
  })

  it('accepts message with both body and attachments', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      body: '本文',
      created_at: Date.now(),
      attachments: [sampleAttachment],
    })

    expect(message.isValidForDatabase()).toBe(true)
  })

  it('accepts message with up to CHAT_ATTACHMENT_MAX_COUNT attachments', () => {
    const attachments = Array.from({ length: CHAT_ATTACHMENT_MAX_COUNT }, (_, index) => ({
      ...sampleAttachment,
      storage_path: `chat_rooms/room1/msg1/att${index}`,
      file_name: `photo-${index}.png`,
    }))
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: Date.now(),
      attachments,
    })

    expect(message.isValidForDatabase()).toBe(true)
    const firestore = message.toFirestore()
    if (firestore.message_type === 'user') {
      expect(firestore.attachments).toHaveLength(CHAT_ATTACHMENT_MAX_COUNT)
    }
  })

  it('rejects message exceeding CHAT_ATTACHMENT_MAX_COUNT attachments', () => {
    const attachments = Array.from({ length: CHAT_ATTACHMENT_MAX_COUNT + 1 }, (_, index) => ({
      ...sampleAttachment,
      storage_path: `chat_rooms/room1/msg1/att${index}`,
      file_name: `photo-${index}.png`,
    }))
    expect(
      () =>
        new ChatMessage('msg1', {
          message_type: 'user',
          sender_user_id: 'user1',
          created_at: Date.now(),
          attachments,
        }),
    ).toThrow()
  })

  it('rejects unsupported attachment mime type', () => {
    expect(() =>
      ChatAttachmentSchema.parse({
        ...sampleAttachment,
        content_type: 'application/pdf',
      }),
    ).toThrow()
  })
})

describe('getChatAttachmentStoragePath', () => {
  it('builds path under chat_rooms', () => {
    expect(getChatAttachmentStoragePath('room1', 'msg1', 'att1')).toBe('chat_rooms/room1/msg1/att1')
  })
})

describe('getChatAttachmentMessagePrefix', () => {
  it('builds prefix for deleteFiles', () => {
    expect(getChatAttachmentMessagePrefix('room1', 'msg1')).toBe('chat_rooms/room1/msg1/')
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
