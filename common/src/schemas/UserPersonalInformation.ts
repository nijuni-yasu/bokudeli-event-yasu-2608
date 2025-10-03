import { z } from 'zod'
import { NonEmptyStringSchema } from './firebase/index.js'

const UserPersonalInformationDbSchema = z.object({
  user_email: z.string().email(),
  // optional
  user_sns_google: NonEmptyStringSchema.optional(),
  user_sns_twitter_access_token: NonEmptyStringSchema.optional(),
  user_sns_twitter_secret: NonEmptyStringSchema.optional(),
})

const UserPersonalInformationAppSchema = z.object({
  user_email: z.string().default(''),
  user_sns_google: z.string().default(''),
  user_sns_twitter_access_token: z.string().default(''),
  user_sns_twitter_secret: z.string().default(''),
})

export class UserPersonalInformation {
  readonly id: string
  user_email: string = ''
  user_sns_google: string = ''
  user_sns_twitter_access_token: string = ''
  user_sns_twitter_secret: string = ''

  constructor(id: string, src: Partial<UserPersonalInformation>) {
    Object.assign(this, UserPersonalInformationAppSchema.parse(src))
    this.id = id
  }

  isValidForDatabase(): boolean {
    return UserPersonalInformationDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof UserPersonalInformationDbSchema> {
    return UserPersonalInformationDbSchema.parse(this)
  }
}
