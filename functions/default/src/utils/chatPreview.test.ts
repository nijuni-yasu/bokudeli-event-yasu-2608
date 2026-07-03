import { describe, expect, it } from 'vitest'
import { ChatMessage } from '@shokujii/common/schemas/ChatMessage.js'
import { buildMessagePreview, CHAT_LAST_MESSAGE_PREVIEW_IMAGE } from './chatPreview.js'

describe('buildMessagePreview', () => {
  it('returns body preview for text-only user message', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      body: 'こんにちは',
      created_at: Date.now(),
    })

    expect(buildMessagePreview(message)).toBe('こんにちは')
  })

  it('returns image preview for attachment-only user message', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      created_at: Date.now(),
      attachments: [
        {
          storage_path: 'chat_rooms/room1/msg1/att1',
          content_type: 'image/png',
          file_name: 'photo.png',
          byte_size: 1024,
          width: 800,
          height: 600,
        },
      ],
    })

    expect(buildMessagePreview(message)).toBe(CHAT_LAST_MESSAGE_PREVIEW_IMAGE)
  })

  it('prefers body preview when both body and attachments exist', () => {
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      body: '本文あり',
      created_at: Date.now(),
      attachments: [
        {
          storage_path: 'chat_rooms/room1/msg1/att1',
          content_type: 'image/jpeg',
          file_name: 'photo.jpg',
          byte_size: 2048,
          width: 640,
          height: 480,
        },
      ],
    })

    expect(buildMessagePreview(message)).toBe('本文あり')
  })
})
