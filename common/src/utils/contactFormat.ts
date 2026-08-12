/**
 * メールアドレス・電話番号の形式チェック（UI validators と validateReservationRequest で共通利用）。
 * base/src/composable/validators.ts と同一の正規表現を用いる。
 */

/** @see https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s01.html */
const EMAIL_PATTERN = /^[\w!#$%&'*+/=?`{|}~^-]+(\.[\w!#$%&'*+/=?`{|}~^-]+)*@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/

/** @see https://akinov.hatenablog.com/entry/2017/05/31/194421 */
const PHONE_PATTERNS = [
  /^0(\d{1}[-(]?\d{4}|\d{2}[-(]?\d{3}|\d{3}[-(]?\d{2}|\d{4}[-(]?\d{1})[-)]?\d{4}$/,
  /^0[5789]0[-(]?\d{4}[-)]?\d{4}$/,
  /^0120[-(]?\d{3}[-)]?\d{3}$/,
] as const

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERNS.some((pattern) => pattern.test(value))
}
