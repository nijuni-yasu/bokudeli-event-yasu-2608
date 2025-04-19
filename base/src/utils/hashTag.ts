/**
 * ハッシュタグから不適切な文字を削除します
 * @param value トリムする文字列
 * @returns トリムされた文字列
 */
export const trimHashTag = (value: string): string => {
  if (typeof value !== 'string' || value === '') return ''
  return value.replace(/[\s#@!$%^&*()+=<>?/\\,.;:'"[\]{}|~`]/g, '').trim()
}
