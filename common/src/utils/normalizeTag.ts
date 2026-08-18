/**
 * タグ文字列の正規化（プロフィールタグ仕様）
 * - 前後の空白を除去
 * - 全角英数字を半角に変換（大文字小文字はマスタタグ定数の表記を維持）
 */
const FULLWIDTH_DIGIT_START = 0xff10
const FULLWIDTH_UPPER_START = 0xff21
const FULLWIDTH_LOWER_START = 0xff41

function toHalfWidthAsciiChar(code: number): string | null {
  if (code >= FULLWIDTH_DIGIT_START && code <= FULLWIDTH_DIGIT_START + 9) {
    return String.fromCharCode(0x30 + (code - FULLWIDTH_DIGIT_START))
  }
  if (code >= FULLWIDTH_UPPER_START && code <= FULLWIDTH_UPPER_START + 25) {
    return String.fromCharCode(0x41 + (code - FULLWIDTH_UPPER_START))
  }
  if (code >= FULLWIDTH_LOWER_START && code <= FULLWIDTH_LOWER_START + 25) {
    return String.fromCharCode(0x61 + (code - FULLWIDTH_LOWER_START))
  }
  return null
}

export function normalizeTag(raw: string): string {
  const s = raw.trim()
  let out = ''
  for (const c of s) {
    const code = c.codePointAt(0)!
    const half = toHalfWidthAsciiChar(code)
    if (half !== null) {
      out += half
      continue
    }
    out += c
  }
  return out.trim()
}

/** 配列を正規化し、空文字を除き、重複を除去（先勝ち） */
export function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tags) {
    const n = normalizeTag(t)
    if (n.length === 0 || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}
