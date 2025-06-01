import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

const UserDbSchema = z.object({
  // Mandatory
  user_id: z.string().nonempty(),
  user_name: z.string().nonempty(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  user_description: NonEmptyStringSchema.optional(),
  user_image_url: NonEmptyStringSchema.optional(),
  user_sns_facebook: NonEmptyStringSchema.optional(),
  user_sns_twitter: NonEmptyStringSchema.optional(),
  user_sns_instagram: NonEmptyStringSchema.optional(),
})

const UserAppSchema = z.object({
  user_name: z.string(),
  user_description: z.string().optional(),
  user_image_url: z.string().optional(),
  user_sns_facebook: z.string().optional(),
  user_sns_twitter: z.string().optional(),
  user_sns_instagram: z.string().optional(),
})

export class User {
  // Mandatory
  readonly id: string
  readonly user_id: string
  user_name!: string
  created_at: number
  updated_at: number
  // Default
  user_description: string = ''
  user_image_url: string = ''
  user_sns_facebook: string = ''
  user_sns_twitter: string = ''
  user_sns_instagram: string = ''

  constructor(id: string, src: Partial<User>) {
    Object.assign(this, UserAppSchema.parse(src))
    this.id = id
    this.user_id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  private get db() {
    return {
      ...this,
      updated_at: Date.now(),
    }
  }

  isValidForDatabase(): boolean {
    return UserDbSchema.safeParse(this.db).success
  }

  toFirestore(): z.infer<typeof UserDbSchema> {
    return UserDbSchema.parse(this)
  }
}
