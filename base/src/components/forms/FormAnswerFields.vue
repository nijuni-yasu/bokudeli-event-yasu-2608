<script setup lang="ts">
import type { FormField } from '@shokujii/common/schemas/formFields.js'
import type { FormAnswerInput, FormValidationIssue } from '@shokujii/common/utils/validateFormAnswers.js'

const props = withDefaults(
  defineProps<{
    fields: FormField[]
    modelValue: FormAnswerInput[]
    disabled?: boolean
    issues?: FormValidationIssue[]
  }>(),
  {
    disabled: false,
    issues: () => [],
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: FormAnswerInput[]]
}>()

const { t: $t } = useI18n()

const issueMessage = (fieldId: string): string => {
  const issue = props.issues.find((item) => item.field_id === fieldId)
  if (issue == null) {
    return ''
  }
  return $t(`manage.forms.issues.${issue.code}`)
}

const answerFor = (fieldId: string): FormAnswerInput => {
  return props.modelValue.find((answer) => answer.field_id === fieldId) ?? { field_id: fieldId }
}

const upsert = (next: FormAnswerInput) => {
  const rest = props.modelValue.filter((answer) => answer.field_id !== next.field_id)
  emit('update:modelValue', [...rest, next])
}

const setText = (fieldId: string, textValue: string) => {
  upsert({ field_id: fieldId, text_value: textValue })
}

const setOption = (fieldId: string, optionId: string) => {
  upsert({ field_id: fieldId, option_id: optionId })
}

const setOptions = (fieldId: string, optionIds: string[]) => {
  upsert({ field_id: fieldId, option_ids: optionIds })
}

const visibleOptions = (field: FormField) => {
  if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select') {
    return []
  }
  return field.options.filter((option) => !option.hidden_for_new)
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div v-for="field in fields" :key="field.field_id">
      <div class="text-subtitle-1 font-weight-medium mb-1">
        {{ field.label }}
        <span v-if="field.required" class="text-error">*</span>
      </div>
      <div v-if="field.description !== ''" class="text-body-2 text-medium-emphasis mb-2">
        {{ field.description }}
      </div>
      <v-text-field
        v-if="field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'date'"
        :model-value="answerFor(field.field_id).text_value ?? ''"
        :type="field.type === 'text' ? 'text' : field.type"
        :disabled="disabled"
        :error-messages="issueMessage(field.field_id)"
        hide-details="auto"
        variant="outlined"
        @update:model-value="setText(field.field_id, String($event ?? ''))"
      />
      <v-textarea
        v-else-if="field.type === 'textarea'"
        :model-value="answerFor(field.field_id).text_value ?? ''"
        :disabled="disabled"
        :error-messages="issueMessage(field.field_id)"
        hide-details="auto"
        variant="outlined"
        rows="4"
        @update:model-value="setText(field.field_id, String($event ?? ''))"
      />
      <v-radio-group
        v-else-if="field.type === 'radio'"
        :model-value="answerFor(field.field_id).option_id ?? ''"
        :disabled="disabled"
        :error-messages="issueMessage(field.field_id)"
        hide-details="auto"
        @update:model-value="setOption(field.field_id, String($event ?? ''))"
      >
        <v-radio v-for="option in visibleOptions(field)" :key="option.option_id" :label="option.label" :value="option.option_id" />
      </v-radio-group>
      <v-select
        v-else-if="field.type === 'select'"
        :model-value="answerFor(field.field_id).option_id ?? ''"
        :items="visibleOptions(field)"
        item-title="label"
        item-value="option_id"
        :disabled="disabled"
        :error-messages="issueMessage(field.field_id)"
        hide-details="auto"
        variant="outlined"
        @update:model-value="setOption(field.field_id, String($event ?? ''))"
      />
      <v-select
        v-else-if="field.type === 'checkbox'"
        :model-value="answerFor(field.field_id).option_ids ?? []"
        :items="visibleOptions(field)"
        item-title="label"
        item-value="option_id"
        multiple
        chips
        :disabled="disabled"
        :error-messages="issueMessage(field.field_id)"
        hide-details="auto"
        variant="outlined"
        @update:model-value="setOptions(field.field_id, Array.isArray($event) ? $event.map(String) : [])"
      />
    </div>
  </div>
</template>
