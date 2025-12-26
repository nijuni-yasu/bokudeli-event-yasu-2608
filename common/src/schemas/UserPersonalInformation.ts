import { z } from 'zod'

const UserPersonalInformationDbSchema = z.object({
  user_email: z.string().email().or(z.literal('')),
})

const UserPersonalInformationAppSchema = z.object({
  user_email: z.string().default(''),
})

export class UserPersonalInformation {
  readonly id: string
  user_email: string = ''

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
