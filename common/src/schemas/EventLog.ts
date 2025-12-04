import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema, DocumentData } from './firebase/index.js'

// Firestore(DB) 側のスキーマ
const EventLogDbSchema = z
  .object({
    // 必須フィールド
    updated_at: TimestampSchema,
    updated_by: z.string().nonempty(),
  })
  // 差分として保存される任意のフィールドをすべて許可
  .passthrough()

// アプリ側(クラス)用のスキーマ
const EventLogAppSchema = z
  .object({
    // 必須フィールド
    updated_at: EpochMillisSchema,
    updated_by: z.string().nonempty(),
  })
  // 差分として取得する任意フィールドをすべて許可
  .passthrough()

export class EventLog {
  readonly id: string

  // 必須フィールド
  updated_at!: number
  updated_by!: string;

  // 差分として入ってくる任意フィールドを許可
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any

  constructor(id: string, src: DocumentData) {
    Object.assign(this, EventLogAppSchema.parse(src))
    this.id = id
  }

  isValidForDatabase(): boolean {
    return EventLogDbSchema.safeParse(this).success
  }

  toFirestore() {
    return EventLogDbSchema.parse(this)
  }
}
