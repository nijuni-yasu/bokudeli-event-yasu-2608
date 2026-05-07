import { DateTime } from 'luxon'
import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

const nowMillis = () => DateTime.now().toMillis()

const EventHistoryEntryDbSchema = z.object({
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_at: TimestampSchema,
})

const EventHistoryEntryAppSchema = z.object({
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_at: EpochMillisSchema,
})

const UserFriendDbSchema = z.object({
  first_met_at: TimestampSchema,
  last_met_at: TimestampSchema,
  meet_count: z.number().int().nonnegative(),
  event_history: z.array(EventHistoryEntryDbSchema),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const UserFriendAppSchema = z.object({
  first_met_at: EpochMillisSchema,
  last_met_at: EpochMillisSchema,
  meet_count: z.number().int().nonnegative(),
  event_history: z.array(EventHistoryEntryAppSchema),
  created_at: EpochMillisSchema.optional(),
  updated_at: EpochMillisSchema.optional(),
})

const convertToDb = (friend: UserFriend) => {
  return {
    ...friend,
    created_at: EpochMillisSchema.default(nowMillis()).parse(friend.created_at),
    updated_at: nowMillis(),
  }
}

export class UserFriend {
  readonly id: string
  first_met_at!: number
  last_met_at!: number
  meet_count!: number
  event_history!: z.infer<typeof EventHistoryEntryAppSchema>[]
  created_at: number
  updated_at: number

  constructor(friendUserId: string, src: Partial<UserFriend>) {
    Object.assign(this, UserFriendAppSchema.parse(src))
    this.id = friendUserId
    this.created_at = EpochMillisSchema.default(nowMillis()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(nowMillis()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return UserFriendDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof UserFriendDbSchema> {
    return UserFriendDbSchema.parse(convertToDb(this))
  }
}
