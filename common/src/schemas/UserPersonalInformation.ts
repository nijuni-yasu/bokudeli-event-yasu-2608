import { z } from 'zod'

const UserPersonalInformationDbSchema = z.object({
  user_email: z.string().email(),
})

// id 以外は デフォルト なので、 Schema は必要ない
export class UserPersonalInformation {
  readonly id: string
  user_email: string = ''

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
