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

export const NonEmptyStringSchema = z.string().transform((value) => {
  if (value == null || value === '') {
    return FieldValue.delete != null ? FieldValue.delete() : deleteField()
  }
  return value
})
export type NonEmptyStringType = z.infer<typeof NonEmptyStringSchema>
