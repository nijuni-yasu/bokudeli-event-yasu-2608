import { CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '../schemas/ChatRoom.js'

/**
 * Zod の max(100) は UTF-16 コードユニット数（.length）で検証する。
 * 絵文字を含む文字列はコードポイント数と .length が一致しないため、
 * 追加するたびに .length が上限を超えないように切り詰める。
 */
export const truncateLastMessagePreview = (text: string): string => {
  let result = ''
  for (const char of text) {
    const next = result + char
    if (next.length > CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH) {
      break
    }
    result = next
  }
  return result
}

/** Firestore 読み取り時: 不正な長さの preview を Zod 通過可能な長さに正規化する */
export const sanitizeLastMessagePreviewField = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'string') {
    return undefined
  }
  return truncateLastMessagePreview(value)
}
