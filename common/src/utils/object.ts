/**
 * `undefined` 値のキーを落とす。
 *
 * Firestore は `ignoreUndefinedProperties` 未設定のため `undefined` を含むオブジェクトを
 * `set` / `update` すると失敗する。AppSchema で `null` を `undefined` に正規化したフィールドは
 * zod がキー自体を残すため、`toFirestore()` の入力から明示的に除去する必要がある。
 */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}
