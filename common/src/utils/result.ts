/**
 * Result型: 成功または失敗を表現する型
 * エラーハンドリングを明示的に行うためのパターン
 */

export type Ok<T> = { ok: true; value: T }
export type Err<E> = { ok: false; error: E }
export type Result<T, E = Error> = Ok<T> | Err<E>

/**
 * 成功を表すResult値を作成
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })

/**
 * 失敗を表すResult値を作成
 */
export const err = <E>(error: E): Err<E> => ({ ok: false, error })
