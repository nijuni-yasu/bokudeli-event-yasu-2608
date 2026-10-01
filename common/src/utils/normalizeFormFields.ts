import {
  FORM_FIELD_LIMITS,
  FormFieldSchema,
  isChoiceFieldType,
  type FormField,
  type FormOption,
} from '../schemas/formFields.js'
import type { FormFieldInput } from '../apis/form.js'

export type NormalizeFormFieldsResult =
  | { ok: true; fields: FormField[] }
  | { ok: false; message: string }

function createEntityId(prefix: string): string {
  const bytes = new Uint8Array(8)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

function existingTypeById(existing: FormField[] | undefined): Map<string, FormField['type']> {
  const map = new Map<string, FormField['type']>()
  for (const field of existing ?? []) {
    map.set(field.field_id, field.type)
  }
  return map
}

export function normalizeFormFields(
  inputs: FormFieldInput[],
  existing?: FormField[],
): NormalizeFormFieldsResult {
  if (inputs.length > FORM_FIELD_LIMITS.maxFields) {
    return { ok: false, message: `設問は${FORM_FIELD_LIMITS.maxFields}件までです` }
  }

  const usedFieldIds = new Set<string>()
  const typeById = existingTypeById(existing)
  const fields: FormField[] = []

  for (const input of inputs) {
    let fieldId = input.field_id
    if (fieldId != null && typeById.has(fieldId) && typeById.get(fieldId) !== input.type) {
      return { ok: false, message: '同じ設問IDの項目タイプは変更できません' }
    }
    if (fieldId == null || fieldId === '' || usedFieldIds.has(fieldId)) {
      fieldId = createEntityId('fld')
    }
    usedFieldIds.add(fieldId)

    if (isChoiceFieldType(input.type)) {
      const optionInputs = input.options ?? []
      if (optionInputs.length === 0) {
        return { ok: false, message: '選択肢を1件以上入力してください' }
      }
      if (optionInputs.length > FORM_FIELD_LIMITS.maxOptions) {
        return { ok: false, message: `選択肢は${FORM_FIELD_LIMITS.maxOptions}件までです` }
      }
      const usedOptionIds = new Set<string>()
      const options: FormOption[] = optionInputs.map((option) => {
        let optionId = option.option_id
        if (optionId == null || optionId === '' || usedOptionIds.has(optionId)) {
          optionId = createEntityId('opt')
        }
        usedOptionIds.add(optionId)
        return {
          option_id: optionId,
          label: option.label,
          hidden_for_new: option.hidden_for_new ?? false,
        }
      })
      const parsed = FormFieldSchema.safeParse({
        field_id: fieldId,
        type: input.type,
        label: input.label,
        description: input.description ?? '',
        required: input.required,
        hidden_for_new: input.hidden_for_new ?? false,
        options,
      })
      if (!parsed.success) {
        return { ok: false, message: '設問の内容が不正です' }
      }
      fields.push(parsed.data)
      continue
    }

    const parsed = FormFieldSchema.safeParse({
      field_id: fieldId,
      type: input.type,
      label: input.label,
      description: input.description ?? '',
      required: input.required,
      hidden_for_new: input.hidden_for_new ?? false,
    })
    if (!parsed.success) {
      return { ok: false, message: '設問の内容が不正です' }
    }
    fields.push(parsed.data)
  }

  return { ok: true, fields }
}
