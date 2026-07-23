import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const EventMemberTagDbSchema = z.object({
  user_id: z.string().nonempty(),
  user_tags: z.array(z.string()),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const EventMemberTagAppSchema = z.object({
  user_id: z.string().nonempty(),
  user_tags: z.array(z.string()).default([]),
  created_at: EpochMillisSchema.optional(),
  updated_at: EpochMillisSchema.optional(),
})

const convertToDb = (doc: EventMemberTag) => {
  return {
    ...doc,
    created_at: EpochMillisSchema.default(Date.now()).parse(doc.created_at),
    updated_at: Date.now(),
  }
}

export class EventMemberTag {
  readonly id: string
  user_id!: string
  user_tags!: string[]
  created_at: number
  updated_at: number

  constructor(userId: string, src: Partial<EventMemberTag>) {
    Object.assign(this, EventMemberTagAppSchema.parse(src))
    this.id = userId
    this.user_id = userId
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  isValidForDatabase(): boolean {
    return EventMemberTagDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMemberTagDbSchema> {
    return EventMemberTagDbSchema.parse(convertToDb(this))
  }
}
