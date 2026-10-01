import { z } from 'zod'

export const FORM_FIELD_TYPE_VALUES = [
  'text',
  'textarea',
  'email',
  'phone',
  'date',
  'checkbox',
  'radio',
  'select',
] as const
export type FormFieldType = (typeof FORM_FIELD_TYPE_VALUES)[number]

export const FORM_FIELD_LIMITS = {
  maxFields: 20,
  maxOptions: 30,
  maxName: 100,
  maxDescription: 500,
  maxPurpose: 500,
  maxLabel: 200,
  maxShortText: 200,
  maxLongText: 2000,
} as const

export const FORM_DATE_ANSWER_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const CHOICE_FIELD_TYPES = ['checkbox', 'radio', 'select'] as const
export type ChoiceFieldType = (typeof CHOICE_FIELD_TYPES)[number]

export function isChoiceFieldType(type: FormFieldType): type is ChoiceFieldType {
  return (CHOICE_FIELD_TYPES as readonly FormFieldType[]).includes(type)
}

export const FormOptionSchema = z.object({
  option_id: z.string().min(1),
  label: z.string().min(1).max(FORM_FIELD_LIMITS.maxLabel),
  hidden_for_new: z.boolean().default(false),
})
export type FormOption = z.infer<typeof FormOptionSchema>

const FormFieldBaseSchema = z.object({
  field_id: z.string().min(1),
  label: z.string().min(1).max(FORM_FIELD_LIMITS.maxLabel),
  description: z.string().max(FORM_FIELD_LIMITS.maxDescription).default(''),
  required: z.boolean(),
  hidden_for_new: z.boolean().default(false),
})

export const FormFieldSchema = z.discriminatedUnion('type', [
  FormFieldBaseSchema.extend({ type: z.literal('text') }),
  FormFieldBaseSchema.extend({ type: z.literal('textarea') }),
  FormFieldBaseSchema.extend({ type: z.literal('email') }),
  FormFieldBaseSchema.extend({ type: z.literal('phone') }),
  FormFieldBaseSchema.extend({ type: z.literal('date') }),
  FormFieldBaseSchema.extend({
    type: z.literal('checkbox'),
    options: z.array(FormOptionSchema).min(1).max(FORM_FIELD_LIMITS.maxOptions),
  }),
  FormFieldBaseSchema.extend({
    type: z.literal('radio'),
    options: z.array(FormOptionSchema).min(1).max(FORM_FIELD_LIMITS.maxOptions),
  }),
  FormFieldBaseSchema.extend({
    type: z.literal('select'),
    options: z.array(FormOptionSchema).min(1).max(FORM_FIELD_LIMITS.maxOptions),
  }),
])
export type FormField = z.infer<typeof FormFieldSchema>

export const FormFieldsSchema = z.array(FormFieldSchema).max(FORM_FIELD_LIMITS.maxFields)

export function parseFormFields(value: unknown): FormField[] {
  return FormFieldsSchema.parse(value)
}

export const EVENT_FORM_EDITABLE_STATUS_VALUES = [
  'in_draft',
  'applying_reservation',
  'applying_to_admin',
  'accepting_order',
] as const
export type EventFormEditableStatus = (typeof EVENT_FORM_EDITABLE_STATUS_VALUES)[number]

export function isEventFormEditableStatus(status: string): status is EventFormEditableStatus {
  return (EVENT_FORM_EDITABLE_STATUS_VALUES as readonly string[]).includes(status)
}
