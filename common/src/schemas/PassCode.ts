import { z } from 'zod'
import { TimestampSchema, NonEmptyStringSchema, EpochMillisSchema } from './firebase/index.js'

const generatePassCode = (): string => {
  // 1～999999のランダムな整数を生成し、6桁にゼロ埋め
  return Math.floor(1 + Math.random() * 999999)
    .toString()
    .padStart(6, '0')
}

const PassCodeDbSchema = z.object({
  pass_code: z.string(),
  user_email: z.string().email(),
  created_at: TimestampSchema,
  // optional
  user_id: NonEmptyStringSchema.optional(),
  enterprise_id: NonEmptyStringSchema.optional(),
})

const PassCodeAppSchema = z.object({
  user_email: z.string(),
  // optional
  user_id: z.string().optional(),
  enterprise_id: z.string().optional(),
})

export class PassCode {
  readonly id: string
  readonly created_at: number
  readonly pass_code: string
  readonly user_email!: string
  user_id?: string
  enterprise_id?: string

  constructor(id: string, src: Partial<PassCode>) {
    Object.assign(this, PassCodeAppSchema.parse(src))
    this.id = id
    this.pass_code = z.string().default(generatePassCode()).parse(src.pass_code)
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
  }

  isValidForDatabase(): boolean {
    return PassCodeDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof PassCodeDbSchema> {
    return PassCodeDbSchema.parse(this)
  }
}
