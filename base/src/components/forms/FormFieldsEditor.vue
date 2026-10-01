<script setup lang="ts">
import { FORM_FIELD_LIMITS, FORM_FIELD_TYPE_VALUES, isChoiceFieldType } from '@shokujii/common/schemas/formFields.js'
import type { FormFieldInput } from '@shokujii/common/apis/form.js'
import { mdiDelete, mdiPlus } from '@mdi/js'

const props = defineProps<{
  modelValue: FormFieldInput[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FormFieldInput[]]
}>()

const { t: $t } = useI18n()

const typeItems = FORM_FIELD_TYPE_VALUES.map((value) => ({
  value,
  title: $t(`manage.forms.types.${value}`),
}))

const updateField = (index: number, patch: Partial<FormFieldInput>) => {
  emit(
    'update:modelValue',
    props.modelValue.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
  )
}

const addField = () => {
  if (props.modelValue.length >= FORM_FIELD_LIMITS.maxFields) {
    return
  }
  emit('update:modelValue', [
    ...props.modelValue,
    {
      type: 'text',
      label: '',
      description: '',
      required: false,
      hidden_for_new: false,
    },
  ])
}

const removeField = (index: number) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, fieldIndex) => fieldIndex !== index),
  )
}

const addOption = (index: number) => {
  const field = props.modelValue[index]
  const options = [...(field.options ?? [])]
  if (options.length >= FORM_FIELD_LIMITS.maxOptions) {
    return
  }
  options.push({ label: '', hidden_for_new: false })
  updateField(index, { options })
}

const updateOption = (fieldIndex: number, optionIndex: number, patch: { label?: string; hidden_for_new?: boolean }) => {
  const field = props.modelValue[fieldIndex]
  const options = (field.options ?? []).map((option, index) => (index === optionIndex ? { ...option, ...patch } : option))
  updateField(fieldIndex, { options })
}

const removeOption = (fieldIndex: number, optionIndex: number) => {
  const field = props.modelValue[fieldIndex]
  updateField(fieldIndex, {
    options: (field.options ?? []).filter((_, index) => index !== optionIndex),
  })
}

const onTypeChange = (index: number, type: FormFieldInput['type']) => {
  if (isChoiceFieldType(type)) {
    updateField(index, {
      type,
      options: props.modelValue[index].options ?? [{ label: '', hidden_for_new: false }],
    })
    return
  }
  updateField(index, { type, options: undefined })
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-subtitle-1">{{ $t('manage.forms.fields') }}</div>
      <v-btn
        :prepend-icon="mdiPlus"
        :disabled="modelValue.length >= FORM_FIELD_LIMITS.maxFields"
        variant="outlined"
        @click="addField"
      >
        {{ $t('manage.forms.add_field') }}
      </v-btn>
    </div>
    <v-card v-for="(field, index) in modelValue" :key="field.field_id ?? `new-${index}`" class="mb-4" variant="outlined">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              :model-value="field.type"
              :items="typeItems"
              :label="$t('manage.forms.field_type')"
              hide-details
              @update:model-value="onTypeChange(index, $event)"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              :model-value="field.label"
              :label="$t('manage.forms.field_label')"
              :maxlength="FORM_FIELD_LIMITS.maxLabel"
              hide-details
              @update:model-value="updateField(index, { label: String($event ?? '') })"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              :model-value="field.description ?? ''"
              :label="$t('manage.forms.field_description')"
              :maxlength="FORM_FIELD_LIMITS.maxDescription"
              hide-details
              @update:model-value="updateField(index, { description: String($event ?? '') })"
            />
          </v-col>
          <v-col cols="12" class="d-flex flex-wrap ga-4">
            <v-checkbox
              :model-value="field.required"
              :label="$t('manage.forms.field_required')"
              hide-details
              @update:model-value="updateField(index, { required: $event === true })"
            />
            <v-checkbox
              :model-value="field.hidden_for_new === true"
              :label="$t('manage.forms.field_hidden')"
              hide-details
              @update:model-value="updateField(index, { hidden_for_new: $event === true })"
            />
            <v-spacer />
            <v-btn :icon="mdiDelete" variant="text" @click="removeField(index)" />
          </v-col>
          <v-col v-if="isChoiceFieldType(field.type)" cols="12">
            <div class="text-body-2 mb-2">{{ $t('manage.forms.options') }}</div>
            <div v-for="(option, optionIndex) in field.options ?? []" :key="option.option_id ?? `opt-${optionIndex}`" class="d-flex ga-2 mb-2">
              <v-text-field
                :model-value="option.label"
                :label="$t('manage.forms.option_label')"
                hide-details
                @update:model-value="updateOption(index, optionIndex, { label: String($event ?? '') })"
              />
              <v-checkbox
                :model-value="option.hidden_for_new === true"
                :label="$t('manage.forms.option_hidden')"
                hide-details
                @update:model-value="updateOption(index, optionIndex, { hidden_for_new: $event === true })"
              />
              <v-btn :icon="mdiDelete" variant="text" @click="removeOption(index, optionIndex)" />
            </div>
            <v-btn
              :prepend-icon="mdiPlus"
              :disabled="(field.options?.length ?? 0) >= FORM_FIELD_LIMITS.maxOptions"
              size="small"
              variant="text"
              @click="addOption(index)"
            >
              {{ $t('manage.forms.add_option') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
