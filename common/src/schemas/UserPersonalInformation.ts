import { z } from 'zod'

const UserPersonalInformationDbSchema = z.object({
  user_email: z.string().email(),
  user_email_pending: z.string(),
  user_sns_google: z.string(),
  user_sns_twitter_access_token: z.string(),
  user_sns_twitter_secret: z.string(),
})

// id 以外は デフォルト なので、 Schema は必要ない
export class UserPersonalInformation {
  readonly id: string
  user_email: string = ''
  user_email_pending: string = ''
  user_sns_google: string = ''
  user_sns_twitter_access_token: string = ''
  user_sns_twitter_secret: string = ''

  constructor(id: string, src: Partial<UserPersonalInformation>) {
    Object.assign(this, src)
    this.id = id
  }

  isValidForDatabase(): boolean {
    return UserPersonalInformationDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof UserPersonalInformationDbSchema> {
    return UserPersonalInformationDbSchema.parse(this)
  }
}
