import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'
import { FORM_FIELD_LIMITS, FormFieldsSchema, type FormField } from './formFields.js'

const CommunityFormDbSchema = z.object({
  community_id: z.string().min(1),
  name: z.string().min(1).max(FORM_FIELD_LIMITS.maxName),
  description: NonEmptyStringSchema.optional(),
  purpose: NonEmptyStringSchema.optional(),
  fields: FormFieldsSchema,
  archived: z.boolean(),
  created_by: z.string().min(1),
  updated_by: z.string().min(1),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const CommunityFormAppSchema = z.object({
  community_id: z.string().min(1),
  name: z.string().min(1).max(FORM_FIELD_LIMITS.maxName),
  description: z.string().default(''),
  purpose: z.string().default(''),
  fields: FormFieldsSchema,
  archived: z.boolean().default(false),
  created_by: z.string().min(1),
  updated_by: z.string().min(1),
  created_at: EpochMillisSchema,
  updated_at: EpochMillisSchema,
})

const convertToDb = (form: CommunityForm) => {
  const base = {
    community_id: form.community_id,
    name: form.name,
    fields: form.fields,
    archived: form.archived,
    created_by: form.created_by,
    updated_by: form.updated_by,
    created_at: form.created_at,
    updated_at: Date.now(),
  }
  return {
    ...base,
    ...(form.description.trim() !== '' ? { description: form.description } : {}),
    ...(form.purpose.trim() !== '' ? { purpose: form.purpose } : {}),
  }
}

export class CommunityForm {
  readonly id: string
  community_id!: string
  name!: string
  description!: string
  purpose!: string
  fields!: FormField[]
  archived!: boolean
  created_by!: string
  updated_by!: string
  created_at!: number
  updated_at!: number

  constructor(id: string, src: Partial<CommunityForm>) {
    const now = Date.now()
    Object.assign(
      this,
      CommunityFormAppSchema.parse({
        ...src,
        created_at: src.created_at ?? now,
        updated_at: src.updated_at ?? now,
      }),
    )
    this.id = id
  }

  isValidForDatabase(): boolean {
    return CommunityFormDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof CommunityFormDbSchema> {
    return CommunityFormDbSchema.parse(convertToDb(this))
  }
}
