import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'
import { FORM_FIELD_LIMITS, FormFieldsSchema, type FormField } from './formFields.js'

export const EVENT_FORM_CONFIG_DOC_ID = 'current'

const EventFormConfigDbSchema = z.object({
  source_form_id: z.string().min(1),
  definition_version: z.number().int().positive(),
  purpose: NonEmptyStringSchema.optional(),
  fields: FormFieldsSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const EventFormConfigAppSchema = z.object({
  source_form_id: z.string().min(1),
  definition_version: z.number().int().positive(),
  purpose: z.string().default(''),
  fields: FormFieldsSchema,
  created_at: EpochMillisSchema,
  updated_at: EpochMillisSchema,
})

const convertToDb = (config: EventFormConfig) => {
  const base = {
    source_form_id: config.source_form_id,
    definition_version: config.definition_version,
    fields: config.fields,
    created_at: config.created_at,
    updated_at: Date.now(),
  }
  return {
    ...base,
    ...(config.purpose.trim() !== '' ? { purpose: config.purpose } : {}),
  }
}

export class EventFormConfig {
  readonly id: string
  source_form_id!: string
  definition_version!: number
  purpose!: string
  fields!: FormField[]
  created_at!: number
  updated_at!: number

  constructor(id: string, src: Partial<EventFormConfig>) {
    const now = Date.now()
    Object.assign(
      this,
      EventFormConfigAppSchema.parse({
        ...src,
        created_at: src.created_at ?? now,
        updated_at: src.updated_at ?? now,
      }),
    )
    this.id = id
  }

  isValidForDatabase(): boolean {
    return EventFormConfigDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventFormConfigDbSchema> {
    return EventFormConfigDbSchema.parse(convertToDb(this))
  }
}

export function cloneFormFields(fields: FormField[]): FormField[] {
  return FormFieldsSchema.parse(JSON.parse(JSON.stringify(fields)))
}

export { FORM_FIELD_LIMITS }
