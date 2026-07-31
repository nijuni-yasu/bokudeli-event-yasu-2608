import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'
import { USER_TYPE_VALUES } from './Enterprise.js'

const NonNegativeIntSchema = z.number().int().nonnegative()

/** Firestore に null が残るレガシーデータ向け。read 時に空文字へ正規化する（Issue #2145） */
const nullableStringDefaultEmpty = () =>
  z
    .string()
    .nullable()
    .transform((v) => v ?? '')
    .default('')

const UserDbSchema = z.object({
  // Mandatory
  user_id: z.string().nonempty(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  user_name: NonEmptyStringSchema.optional(),
  user_description: NonEmptyStringSchema.optional(),
  user_image_url: NonEmptyStringSchema.optional(),
  user_sns_facebook: NonEmptyStringSchema.optional(),
  user_sns_facebook_name: NonEmptyStringSchema.optional(),
  user_sns_twitter: NonEmptyStringSchema.optional(),
  user_sns_instagram: NonEmptyStringSchema.optional(),
  user_sns_website: NonEmptyStringSchema.optional(),
  // user_account (ユーザーURL) の設定機能はオミット済み. 設定済みのデータはDBに残している
  user_account: NonEmptyStringSchema.optional(),
  is_deleted: z.boolean().optional(),
  deleted_at: TimestampSchema.optional(),
  // マイページ用の冗長カウント。本番 backfill 完了後に required へ格上げ済み（PR6）
  participated_event_count: NonNegativeIntSchema,
  friend_count: NonNegativeIntSchema,
  joined_community_count: NonNegativeIntSchema,
  managed_community_count: NonNegativeIntSchema,
  ordered_food_count: NonNegativeIntSchema,
  // counts_updated_at は初回 recount 完了までセットされない可能性があるため optional のまま
  counts_updated_at: TimestampSchema.optional(),
  user_type: z.enum(USER_TYPE_VALUES).optional(),
  enterprise_id: NonEmptyStringSchema.optional(),
})

const UserAppSchema = z.object({
  user_name: z.string().default(''),
  // NOTE: プロフィール文字列フィールドに null が保存されているユーザーが存在するため、
  // null を受け入れて空文字列に変換している（Issue #2145）
  user_description: nullableStringDefaultEmpty(),
  user_image_url: nullableStringDefaultEmpty(),
  user_sns_facebook: nullableStringDefaultEmpty(),
  user_sns_facebook_name: nullableStringDefaultEmpty(),
  user_sns_twitter: nullableStringDefaultEmpty(),
  user_sns_instagram: nullableStringDefaultEmpty(),
  user_sns_website: nullableStringDefaultEmpty(),
  is_deleted: z.boolean().default(false),
  deleted_at: EpochMillisSchema.optional(),
  // マイページ用の冗長カウント。read 側は未設定を 0 として扱う
  participated_event_count: NonNegativeIntSchema.default(0),
  friend_count: NonNegativeIntSchema.default(0),
  joined_community_count: NonNegativeIntSchema.default(0),
  managed_community_count: NonNegativeIntSchema.default(0),
  ordered_food_count: NonNegativeIntSchema.default(0),
  counts_updated_at: EpochMillisSchema.optional(),
  user_type: z.enum(USER_TYPE_VALUES).optional(),
  /** PF materialize 後の `enterprise_id: null` を read 互換（未所属は undefined） */
  enterprise_id: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
})

const convertToDb = (user: User) => {
  return {
    ...user,
    updated_at: Date.now(),
  }
}

export class User {
  // Mandatory
  readonly id: string
  readonly user_id: string
  created_at: number
  updated_at: number
  // Default
  user_name!: string
  user_description!: string
  user_image_url!: string
  user_sns_facebook!: string
  user_sns_facebook_name!: string
  user_sns_twitter!: string
  user_sns_instagram!: string
  user_sns_website!: string
  is_deleted!: boolean
  deleted_at?: number
  // マイページ用の冗長カウント
  participated_event_count!: number
  friend_count!: number
  joined_community_count!: number
  managed_community_count!: number
  ordered_food_count!: number
  counts_updated_at?: number
  user_type?: (typeof USER_TYPE_VALUES)[number]
  enterprise_id?: string

  constructor(id: string, src: Partial<User>) {
    Object.assign(this, UserAppSchema.parse(src))
    this.id = id
    this.user_id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  isValidForDatabase(): boolean {
    return UserDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof UserDbSchema> {
    return UserDbSchema.parse(convertToDb(this))
  }
}
