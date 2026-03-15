import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

const UserPersonalInformationDbSchema = z.object({
  user_email: z.string().email().or(z.literal('')),
  is_deleted: z.boolean().optional(),
  deleted_at: TimestampSchema.optional(),
})

const UserPersonalInformationAppSchema = z.object({
  user_email: z.string().default(''),
  is_deleted: z.boolean().default(false),
  deleted_at: EpochMillisSchema.optional(),
})

export class UserPersonalInformation {
  readonly id: string
  user_email: string = ''
  is_deleted: boolean = false
  deleted_at?: number

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
