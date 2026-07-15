import { describe, expect, it } from 'vitest'
import { CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '@shokujii/common/schemas/ChatRoom.js'
import { ChatMessage } from '@shokujii/common/schemas/ChatMessage.js'
import { truncateLastMessagePreview } from '@shokujii/common/utils/chatLastMessagePreview.js'
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

  it('truncates emoji-heavy event announcement within Zod max length (issue #2179)', () => {
    const body = `主催者請求書払いテスト

📅日時：2027/05/03(月) 13:00~13:06
⏳期限：2027/05/01(土) 23:59に注文締切
📍場所：東京都千代田区神田練塀町 3322 
👥主催：yasu
👩‍🍳食事：季節の恵み かさね
👉詳細：https://test.tabete.co/c/yasu/e/3fstfqB3BE0sSQxpJhnV

#yasu #898 `
    const message = new ChatMessage('msg1', {
      message_type: 'user',
      sender_user_id: 'user1',
      body,
      created_at: Date.now(),
    })

    const preview = buildMessagePreview(message)
    expect(preview.length).toBeLessThanOrEqual(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
    expect(truncateLastMessagePreview(body.trim()).length).toBeLessThanOrEqual(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
  })
})
