import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'
import { FORM_FIELD_TYPE_VALUES } from './formFields.js'

export const FormAnswerSnapshotSchema = z.object({
  field_id: z.string().min(1),
  field_type: z.enum(FORM_FIELD_TYPE_VALUES),
  field_label: z.string().min(1),
  field_description: z.string().default(''),
  text_value: z.string().optional(),
  option_id: z.string().optional(),
  option_ids: z.array(z.string().min(1)).optional(),
  option_labels: z
    .array(
      z.object({
        option_id: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .optional(),
})
export type FormAnswerSnapshot = z.infer<typeof FormAnswerSnapshotSchema>

const FormResponseDbSchema = z.object({
  user_id: z.string().min(1),
  definition_version: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
  answers: z.array(FormAnswerSnapshotSchema),
  answered_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const FormResponseAppSchema = z.object({
  user_id: z.string().min(1),
  definition_version: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
  answers: z.array(FormAnswerSnapshotSchema),
  answered_at: EpochMillisSchema,
  updated_at: EpochMillisSchema,
})

const convertToDb = (response: FormResponse) => {
  return {
    user_id: response.user_id,
    definition_version: response.definition_version,
    revision: response.revision,
    answers: response.answers,
    answered_at: response.answered_at,
    updated_at: Date.now(),
  }
}

export class FormResponse {
  readonly id: string
  user_id!: string
  definition_version!: number
  revision!: number
  answers!: FormAnswerSnapshot[]
  answered_at!: number
  updated_at!: number

  constructor(id: string, src: Partial<FormResponse>) {
    const now = Date.now()
    Object.assign(
      this,
      FormResponseAppSchema.parse({
        ...src,
        answered_at: src.answered_at ?? now,
        updated_at: src.updated_at ?? now,
      }),
    )
    this.id = id
  }

  isValidForDatabase(): boolean {
    return FormResponseDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof FormResponseDbSchema> {
    return FormResponseDbSchema.parse(convertToDb(this))
  }
}
