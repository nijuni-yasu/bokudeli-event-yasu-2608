import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

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
})

const UserAppSchema = z.object({
  user_name: z.string().default(''),
  user_description: z.string().default(''),
  user_image_url: z.string().default(''),
  user_sns_facebook: z.string().default(''),
  user_sns_facebook_name: z.string().default(''),
  user_sns_twitter: z.string().default(''),
  user_sns_instagram: z.string().default(''),
  user_sns_website: z.string().default(''),
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
