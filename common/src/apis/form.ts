import { z } from 'zod'
import { FORM_FIELD_LIMITS, FORM_FIELD_TYPE_VALUES } from '../schemas/formFields.js'
import type { FormField } from '../schemas/formFields.js'
import type { FormAnswerInput, FormValidationIssue } from '../utils/validateFormAnswers.js'
import type { FormAnswerSnapshot } from '../schemas/FormResponse.js'

export const FormOptionInputSchema = z.object({
  option_id: z.string().min(1).optional(),
  label: z.string().min(1).max(FORM_FIELD_LIMITS.maxLabel),
  hidden_for_new: z.boolean().optional(),
})

export const FormFieldInputSchema = z.object({
  field_id: z.string().min(1).optional(),
  type: z.enum(FORM_FIELD_TYPE_VALUES),
  label: z.string().min(1).max(FORM_FIELD_LIMITS.maxLabel),
  description: z.string().max(FORM_FIELD_LIMITS.maxDescription).optional(),
  required: z.boolean(),
  hidden_for_new: z.boolean().optional(),
  options: z.array(FormOptionInputSchema).max(FORM_FIELD_LIMITS.maxOptions).optional(),
})
export type FormFieldInput = z.infer<typeof FormFieldInputSchema>

export type FormFieldDto = FormField

export type CommunityFormSummary = {
  form_id: string
  name: string
  description: string
  purpose: string
  archived: boolean
  field_count: number
  updated_at: number
}

export type CommunityFormDetail = CommunityFormSummary & {
  fields: FormFieldDto[]
  created_at: number
}

export const ListCommunityFormsRequestSchema = z.object({
  community_id: z.string().min(1),
})
export type ListCommunityFormsRequest = z.infer<typeof ListCommunityFormsRequestSchema>
export type ListCommunityFormsResponse = {
  forms: CommunityFormSummary[]
}

export const GetCommunityFormRequestSchema = z.object({
  community_id: z.string().min(1),
  form_id: z.string().min(1),
})
export type GetCommunityFormRequest = z.infer<typeof GetCommunityFormRequestSchema>
export type GetCommunityFormResponse = {
  form: CommunityFormDetail
}

export const CreateCommunityFormRequestSchema = z.object({
  community_id: z.string().min(1),
  name: z.string().min(1).max(FORM_FIELD_LIMITS.maxName),
  description: z.string().max(FORM_FIELD_LIMITS.maxDescription).optional(),
  purpose: z.string().max(FORM_FIELD_LIMITS.maxPurpose).optional(),
  fields: z.array(FormFieldInputSchema).max(FORM_FIELD_LIMITS.maxFields),
})
export type CreateCommunityFormRequest = z.infer<typeof CreateCommunityFormRequestSchema>
export type CreateCommunityFormResponse = {
  form: CommunityFormDetail
}

export const UpdateCommunityFormRequestSchema = CreateCommunityFormRequestSchema.extend({
  form_id: z.string().min(1),
  archived: z.boolean().optional(),
})
export type UpdateCommunityFormRequest = z.infer<typeof UpdateCommunityFormRequestSchema>
export type UpdateCommunityFormResponse = {
  form: CommunityFormDetail
}

export const DuplicateCommunityFormRequestSchema = z.object({
  community_id: z.string().min(1),
  form_id: z.string().min(1),
})
export type DuplicateCommunityFormRequest = z.infer<typeof DuplicateCommunityFormRequestSchema>
export type DuplicateCommunityFormResponse = {
  form: CommunityFormDetail
}

export const ArchiveCommunityFormRequestSchema = z.object({
  community_id: z.string().min(1),
  form_id: z.string().min(1),
  archived: z.boolean(),
})
export type ArchiveCommunityFormRequest = z.infer<typeof ArchiveCommunityFormRequestSchema>
export type ArchiveCommunityFormResponse = {
  form: CommunityFormDetail
}

export type EventFormConfigDto = {
  source_form_id: string
  definition_version: number
  purpose: string
  fields: FormFieldDto[]
  updated_at: number
}

export const GetEventFormPresenceRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
})
export type GetEventFormPresenceRequest = z.infer<typeof GetEventFormPresenceRequestSchema>
export type GetEventFormPresenceResponse = {
  has_form: boolean
}

export const GetEventFormConfigRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
})
export type GetEventFormConfigRequest = z.infer<typeof GetEventFormConfigRequestSchema>
export type GetEventFormConfigResponse = {
  config: EventFormConfigDto | null
}

export const SetEventFormFromCommunityRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
  form_id: z.string().min(1),
})
export type SetEventFormFromCommunityRequest = z.infer<typeof SetEventFormFromCommunityRequestSchema>
export type SetEventFormFromCommunityResponse = {
  config: EventFormConfigDto
}

export const UpdateEventFormConfigRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
  purpose: z.string().max(FORM_FIELD_LIMITS.maxPurpose).optional(),
  fields: z.array(FormFieldInputSchema).max(FORM_FIELD_LIMITS.maxFields),
})
export type UpdateEventFormConfigRequest = z.infer<typeof UpdateEventFormConfigRequestSchema>
export type UpdateEventFormConfigResponse = {
  config: EventFormConfigDto
}

export const ClearEventFormConfigRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
})
export type ClearEventFormConfigRequest = z.infer<typeof ClearEventFormConfigRequestSchema>
export type ClearEventFormConfigResponse = {
  cleared: boolean
}

export const FormAnswerInputSchema = z.object({
  field_id: z.string().min(1),
  text_value: z.string().optional(),
  option_id: z.string().min(1).optional(),
  option_ids: z.array(z.string().min(1)).optional(),
})

export const GetOrderFormForCartRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
})
export type GetOrderFormForCartRequest = z.infer<typeof GetOrderFormForCartRequestSchema>
export type GetOrderFormForCartResponse = {
  has_form: boolean
  community_name: string
  purpose: string
  definition_version?: number
  fields?: FormFieldDto[]
  initial_answers?: FormAnswerInput[]
  source?: 'attempt' | 'confirmed' | 'empty'
}

export const SaveOrderFormAttemptRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
  definition_version: z.number().int().positive(),
  answers: z.array(FormAnswerInputSchema),
})
export type SaveOrderFormAttemptRequest = z.infer<typeof SaveOrderFormAttemptRequestSchema>
export type SaveOrderFormAttemptResponse = {
  attempt_id: string
  issues?: FormValidationIssue[]
}

export const EVENT_FORM_RESPONSE_FILTER_VALUES = ['confirmed', 'canceled'] as const
export type EventFormResponseFilter = (typeof EVENT_FORM_RESPONSE_FILTER_VALUES)[number]

export type EventFormResponseListItem = {
  user_id: string
  display_name: string
  participation: EventFormResponseFilter
  answered_at: number
  updated_at: number
  answers: Array<{
    field_id: string
    field_label: string
    display_value: string
  }>
}

export const ListEventFormResponsesRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
  filter: z.enum(EVENT_FORM_RESPONSE_FILTER_VALUES).default('confirmed'),
})
export type ListEventFormResponsesRequest = z.infer<typeof ListEventFormResponsesRequestSchema>
export type ListEventFormResponsesResponse = {
  responses: EventFormResponseListItem[]
}

export const GetEventFormResponseRequestSchema = z.object({
  community_id: z.string().min(1),
  event_id: z.string().min(1),
  user_id: z.string().min(1),
})
export type GetEventFormResponseRequest = z.infer<typeof GetEventFormResponseRequestSchema>
export type GetEventFormResponseResponse = {
  response: EventFormResponseListItem
}

export type { FormAnswerInput, FormValidationIssue, FormAnswerSnapshot }
