import { DateTime } from 'luxon'
import { isValidEmail, isValidPhone } from './contactFormat.js'
import { FORM_DATE_ANSWER_PATTERN, FORM_FIELD_LIMITS, type FormField, type FormOption } from '../schemas/formFields.js'
import type { FormAnswerSnapshot } from '../schemas/FormResponse.js'

export type FormAnswerInput = {
  field_id: string
  text_value?: string
  option_id?: string
  option_ids?: string[]
}

export type FormValidationIssue = {
  field_id?: string
  code:
    | 'required'
    | 'type'
    | 'unknown_field'
    | 'unknown_option'
    | 'too_long'
    | 'invalid_email'
    | 'invalid_phone'
    | 'invalid_date'
    | 'version_mismatch'
}

export type FormValidationResult =
  | { ok: true; answers: FormAnswerSnapshot[] }
  | { ok: false; issues: FormValidationIssue[] }

function isBlank(value: string | undefined): boolean {
  return value == null || value.trim() === ''
}

function visibleFields(fields: FormField[]): FormField[] {
  return fields.filter((field) => !field.hidden_for_new)
}

function visibleOptions(options: FormOption[]): FormOption[] {
  return options.filter((option) => !option.hidden_for_new)
}

function isValidDateString(value: string): boolean {
  if (!FORM_DATE_ANSWER_PATTERN.test(value)) {
    return false
  }
  const parsed = DateTime.fromISO(value, { zone: 'utc' })
  return parsed.isValid && parsed.toISODate() === value
}

function findAnswer(answers: FormAnswerInput[], fieldId: string): FormAnswerInput | undefined {
  return answers.find((answer) => answer.field_id === fieldId)
}

export function validateFormAnswers(params: {
  fields: FormField[]
  answers: FormAnswerInput[]
  definitionVersion: number
  expectedDefinitionVersion?: number
}): FormValidationResult {
  const issues: FormValidationIssue[] = []
  if (
    params.expectedDefinitionVersion != null &&
    params.expectedDefinitionVersion !== params.definitionVersion
  ) {
    issues.push({ code: 'version_mismatch' })
    return { ok: false, issues }
  }

  const knownIds = new Set(params.fields.map((field) => field.field_id))
  for (const answer of params.answers) {
    if (!knownIds.has(answer.field_id)) {
      issues.push({ field_id: answer.field_id, code: 'unknown_field' })
    }
  }

  const snapshots: FormAnswerSnapshot[] = []
  for (const field of visibleFields(params.fields)) {
    const answer = findAnswer(params.answers, field.field_id)
    if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'select') {
      const options = visibleOptions(field.options)
      if (field.type === 'checkbox') {
        const optionIds = answer?.option_ids ?? []
        if (field.required && optionIds.length === 0) {
          issues.push({ field_id: field.field_id, code: 'required' })
          continue
        }
        if (optionIds.length === 0) {
          continue
        }
        const selected: FormOption[] = []
        for (const optionId of optionIds) {
          const option = options.find((item) => item.option_id === optionId)
          if (option == null) {
            issues.push({ field_id: field.field_id, code: 'unknown_option' })
          } else {
            selected.push(option)
          }
        }
        if (selected.length === optionIds.length) {
          snapshots.push({
            field_id: field.field_id,
            field_type: field.type,
            field_label: field.label,
            field_description: field.description,
            option_ids: selected.map((option) => option.option_id),
            option_labels: selected.map((option) => ({ option_id: option.option_id, label: option.label })),
          })
        }
        continue
      }

      const optionId = answer?.option_id
      if (field.required && isBlank(optionId)) {
        issues.push({ field_id: field.field_id, code: 'required' })
        continue
      }
      if (isBlank(optionId) || optionId == null) {
        continue
      }
      const option = options.find((item) => item.option_id === optionId)
      if (option == null) {
        issues.push({ field_id: field.field_id, code: 'unknown_option' })
        continue
      }
      snapshots.push({
        field_id: field.field_id,
        field_type: field.type,
        field_label: field.label,
        field_description: field.description,
        option_id: option.option_id,
        option_labels: [{ option_id: option.option_id, label: option.label }],
      })
      continue
    }

    const textValue = answer?.text_value
    if (field.required && isBlank(textValue)) {
      issues.push({ field_id: field.field_id, code: 'required' })
      continue
    }
    if (isBlank(textValue) || textValue == null) {
      continue
    }
    const trimmed = textValue.trim()
    const maxLength = field.type === 'textarea' ? FORM_FIELD_LIMITS.maxLongText : FORM_FIELD_LIMITS.maxShortText
    if (trimmed.length > maxLength) {
      issues.push({ field_id: field.field_id, code: 'too_long' })
      continue
    }
    if (field.type === 'email' && !isValidEmail(trimmed)) {
      issues.push({ field_id: field.field_id, code: 'invalid_email' })
      continue
    }
    if (field.type === 'phone' && !isValidPhone(trimmed)) {
      issues.push({ field_id: field.field_id, code: 'invalid_phone' })
      continue
    }
    if (field.type === 'date' && !isValidDateString(trimmed)) {
      issues.push({ field_id: field.field_id, code: 'invalid_date' })
      continue
    }
    snapshots.push({
      field_id: field.field_id,
      field_type: field.type,
      field_label: field.label,
      field_description: field.description,
      text_value: trimmed,
    })
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }
  return { ok: true, answers: snapshots }
}

export function formatFormAnswerDisplay(answer: FormAnswerSnapshot): string {
  if (answer.field_type === 'checkbox') {
    return (answer.option_labels ?? []).map((option) => option.label).join('、')
  }
  if (answer.field_type === 'radio' || answer.field_type === 'select') {
    return answer.option_labels?.[0]?.label ?? ''
  }
  return answer.text_value ?? ''
}

export function answersToInputs(answers: FormAnswerSnapshot[]): FormAnswerInput[] {
  return answers.map((answer) => ({
    field_id: answer.field_id,
    text_value: answer.text_value,
    option_id: answer.option_id,
    option_ids: answer.option_ids,
  }))
}
