import { z } from 'zod'

declare const IS_SERVER: boolean

/*
 * Timestamp が client 用と server 用で異なるため、動的ロードで対応する
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let module: any
if (IS_SERVER) {
  module = await import('./firebase.server.js')
} else {
  module = await import('./firebase.client.js')
}
export type DocumentData = typeof module.DocumentData
export const DocumentReference = module.DocumentReference
const deleteField = module.deleteField
const FieldValue = module.FieldValue

// この実装はかなり無理矢理なので、DB で DocumentReference を使用するのは避けた方がよいかもしれない
export let getRefFromPath: (path: string) => typeof DocumentReference
if (IS_SERVER) {
  getRefFromPath = (path: string) => module.getFirestore().doc(path)
} else {
  getRefFromPath = (path: string) => module.doc(module.getFirestore(), path)
}

export const Timestamp = module.Timestamp

/**
 * Firestore の Timestamp 型に正規化する Zod スキーマ。
 * number（Unix ミリ秒）、Firestore Timestamp、または { seconds, nanoseconds } を受け取り、
 * 出力は Firestore Timestamp に統一する。
 * DbSchema に使う（created_at / updated_at / deleted_at など、DB に Timestamp で保存するフィールド）。
 */
export const TimestampSchema = z
  .union([
    z.number().int().positive(),
    z.object({
      seconds: z.number(),
      nanoseconds: z.number(),
    }),
    z.any().refine(
      (value) => {
        // Timestamp オブジェクトの特徴をチェック
        return value && typeof value.toMillis === 'function'
      },
      { message: 'Invalid Timestamp object' },
    ),
  ])
  .transform((value) => (typeof value === 'number' ? Timestamp.fromMillis(value) : value))

/**
 * Unix ミリ秒（number）に正規化する Zod スキーマ。
 * number、Firestore Timestamp、または { seconds, nanoseconds } を受け取り、
 * 出力は number（ミリ秒）に統一する。
 * AppSchema に使う（アプリ側で日付比較や表示に使うフィールドの読み込み時）。
 */
export const EpochMillisSchema = z
  .union([
    z.number().int().positive(),
    z.object({
      seconds: z.number(),
      nanoseconds: z.number(),
    }),
    z.any().refine(
      (value) => {
        // Timestamp オブジェクトの特徴をチェック
        return value && typeof value.toMillis === 'function'
      },
      { message: 'Invalid Timestamp object' },
    ),
  ])
  .transform((value) => {
    if (typeof value === 'number') {
      return value
    }
    // Timestamp オブジェクトの場合
    if (value && typeof value.toMillis === 'function') {
      return value.toMillis()
    }
    // Firestore から取得した生の Timestamp データの場合
    if (value && typeof value.seconds === 'number') {
      return value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000)
    }
    throw new Error('Invalid value for EpochMillisSchema')
  })

/**
 * 空文字を Firestore のフィールド削除（FieldValue.delete() または deleteField()）に変換する Zod スキーマ。
 *
 * Firestore では、string 型において「空文字 ""」と「フィールドなし」は意味が異なる。
 * ユーザーが値を設定しない場合は、空文字として保存するのではなく、フィールド自体を存在させない（フィールドなし）とするためのスキーマ。
 * DbSchema の optional 文字列フィールドに使う。
 */
export const NonEmptyStringSchema = z.string().transform((value) => {
  if (value == null || value === '') {
    return FieldValue.delete != null ? FieldValue.delete() : deleteField()
  }
  return value
})
export type NonEmptyStringType = z.infer<typeof NonEmptyStringSchema>
