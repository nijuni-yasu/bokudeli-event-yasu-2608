import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

const LETTER_STATUSES = ['draft', 'timed', 'sent'] as const
export type LetterStatusType = (typeof LETTER_STATUSES)[number]

const LETTER_TYPES = ['community', 'event_participant', 'event_non_participant', 'individual'] as const
export type LetterTypeType = (typeof LETTER_TYPES)[number]

const CommunityLetterDbSchema = z.object({
  // Mandatory
  letter_id: z.string().nonempty(),
  letter_type: z.literal('community'),
  community_account: z.string().nonempty(),
  status: z.enum(LETTER_STATUSES),
  letter_title: z.string().nonempty(),
  letter_content: z.string().nonempty(),
  scheduled_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  sent_at: TimestampSchema.optional(),
})

const EventLetterDbSchema = z.object({
  // Mandatory
  letter_id: z.string().nonempty(),
  letter_type: z.enum(['event_participant', 'event_non_participant']),
  community_account: z.string().nonempty(),
  event_id: z.string().nonempty(),
  status: z.enum(LETTER_STATUSES),
  letter_title: z.string().nonempty(),
  letter_content: z.string().nonempty(),
  scheduled_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  sent_at: TimestampSchema.optional(),
})

export const IndividualLetterDbSchema = z.object({
  letter_id: z.string().nonempty(),
  letter_type: z.literal('individual'),
  community_account: z.string().nonempty(),
  status: z.enum(LETTER_STATUSES),
  letter_title: z.string().nonempty(),
  letter_content: z.string().nonempty(),
  scheduled_at: TimestampSchema,
  updated_at: TimestampSchema,
  user_id: z.string().nonempty(),
  // Optional
  sent_at: TimestampSchema.optional(),
  event_id: z.string().optional(),
})

const LetterDbSchema = z.discriminatedUnion('letter_type', [
  CommunityLetterDbSchema,
  EventLetterDbSchema,
  IndividualLetterDbSchema,
])

const LetterAppSchema = z.object({
  // Mandatory
  letter_type: z.enum(LETTER_TYPES),
  community_account: z.string(),
  // Default
  status: z.enum(LETTER_STATUSES).default('draft'),
  letter_title: z.string().default(''),
  letter_content: z.string().default(''),
  // Optional
  event_id: z.string().optional(),
  sent_at: EpochMillisSchema.optional(),
  user_id: z.string().optional(),
})

const convertToDb = (letter: Letter) => {
  const base = {
    ...letter,
    updated_at: Date.now(),
  }
  // Firestore は undefined を許容しないため、undefined のフィールドを除外する
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)) as z.infer<typeof LetterDbSchema>
}

export class Letter {
  // Mandatory
  readonly id: string
  readonly letter_id: string
  community_account!: string
  updated_at: number
  scheduled_at: number
  letter_type!: LetterTypeType
  // Default
  status: LetterStatusType = 'draft'
  letter_title: string = ''
  letter_content: string = ''
  // Optional

  event_id?: string
  sent_at?: number
  user_id?: string

  constructor(id: string, src: Partial<Letter>) {
    Object.assign(this, LetterAppSchema.parse(src))
    this.id = id
    this.letter_id = id
    this.scheduled_at = EpochMillisSchema.default(Date.now()).parse(src.scheduled_at)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return LetterDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof LetterDbSchema> {
    return LetterDbSchema.parse(convertToDb(this))
  }
}
