/**
 * ハッシュタグから不適切な文字を削除します
 * @param value トリムする文字列
 * @returns トリムされた文字列
 */
export const trimHashTag = (value: string): string => {
  if (typeof value !== 'string' || value === '') return ''
  return value.replace(/[\s#@!$%^&*()+=<>?/\\,.;:'"[\]{}|~`]/g, '').trim()
}

/** X（Twitter）のハッシュタグ検索 URL。`#` 付き検索語を URLSearchParams でエンコードする。 */
export const buildTwitterHashTagSearchUrl = (hashTag: string): string | undefined => {
  const trimmed = hashTag.trim()
  if (trimmed === '') {
    return undefined
  }
  const params = new URLSearchParams({ q: `#${trimmed}`, f: 'live' })
  return `https://twitter.com/search?${params.toString()}`
}
