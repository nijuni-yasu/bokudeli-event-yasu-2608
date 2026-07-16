import { describe, expect, it } from 'vitest'
import { CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '../schemas/ChatRoom.js'
import { truncateLastMessagePreview, sanitizeLastMessagePreviewField } from './chatLastMessagePreview.js'

describe('truncateLastMessagePreview', () => {
  it('returns text unchanged when within max length', () => {
    expect(truncateLastMessagePreview('こんにちは')).toBe('こんにちは')
  })

  it('truncates plain text to max UTF-16 length', () => {
    const text = 'a'.repeat(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH + 10)
    const result = truncateLastMessagePreview(text)
    expect(result.length).toBe(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
    expect(result).toBe('a'.repeat(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH))
  })

  it('truncates emoji-heavy text so .length stays within max (issue #2179)', () => {
    const body = `主催者請求書払いテスト

📅日時：2027/05/03(月) 13:00~13:06
⏳期限：2027/05/01(土) 23:59に注文締切
📍場所：東京都千代田区神田練塀町 3322 
👥主催：yasu
👩‍🍳食事：季節の恵み かさね
👉詳細：https://test.tabete.co/c/yasu/e/3fstfqB3BE0sSQxpJhnV

#yasu #898 `

    const result = truncateLastMessagePreview(body.trim())
    expect(result.length).toBeLessThanOrEqual(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
    expect(result.length).toBeGreaterThan(0)
  })

  it('does not exceed max when old Array.from-based truncation would fail Zod', () => {
    const emojiPrefix = '📅'.repeat(51)
    const legacyTruncated = Array.from(emojiPrefix).slice(0, CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).join('')
    expect(legacyTruncated.length).toBeGreaterThan(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)

    const result = truncateLastMessagePreview(emojiPrefix)
    expect(result.length).toBeLessThanOrEqual(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
  })
})

describe('sanitizeLastMessagePreviewField', () => {
  it('returns undefined for nullish and non-string values', () => {
    expect(sanitizeLastMessagePreviewField(undefined)).toBeUndefined()
    expect(sanitizeLastMessagePreviewField(null)).toBeUndefined()
    expect(sanitizeLastMessagePreviewField(123)).toBeUndefined()
  })

  it('truncates oversized preview from Firestore', () => {
    const oversized = '📅'.repeat(51)
    const result = sanitizeLastMessagePreviewField(oversized)
    expect(result).toBeDefined()
    expect(result?.length).toBeLessThanOrEqual(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH)
  })
})
