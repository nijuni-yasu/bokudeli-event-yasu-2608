import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema, DocumentData } from './firebase/index.js'
import { EventDbSchema } from './Event.js'

// Firestore(DB) 側のスキーマ
const EventLogDbSchema = z
  .object({
    // 必須フィールド
    updated_at: TimestampSchema,
    updated_by: z.string().nonempty(),
  })
  .merge(EventDbSchema.partial())
  // Event 本体の DB スキーマからは外したが、ログ差分にレガシー項目が残る場合がある
  .merge(z.object({ event_address: z.string().optional() }))

// アプリ側(クラス)用のスキーマ
const EventLogAppSchema = z
  .object({
    // 必須フィールド
    updated_at: EpochMillisSchema,
    updated_by: z.string().nonempty(),
  })
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
