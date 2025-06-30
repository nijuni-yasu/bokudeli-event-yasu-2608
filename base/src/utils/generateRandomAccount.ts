/**
 * 8文字のランダム文字列を生成する関数
 * @returns 8文字のランダム文字列（英数字のみ）
 */
export const generateRandomAccount = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
} 