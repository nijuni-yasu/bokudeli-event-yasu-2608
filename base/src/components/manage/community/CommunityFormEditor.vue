<script setup lang="ts">
import FormFieldsEditor from '@shokujii/base/components/forms/FormFieldsEditor.vue'
import FormAnswerFields from '@shokujii/base/components/forms/FormAnswerFields.vue'
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { createCommunityForm, getCommunityForm, updateCommunityForm } from '@shokujii/base/apis/form.js'
import type { FormFieldInput } from '@shokujii/common/apis/form.js'
import { FORM_FIELD_LIMITS, FormFieldSchema, isChoiceFieldType, type FormField } from '@shokujii/common/schemas/formFields.js'
import { getManageCommunityFormsPath } from '@/router/utils'

const props = defineProps<{
  formId?: string
}>()

const { t: $t } = useI18n()
const router = useRouter()
const notification = useNotification()
const communityAccount = useRoute().params.communityAccount as string
const communityStore = useAppCommunityStore(communityAccount)
const communityId = computed(() => communityStore.community?.community_id ?? '')

const name = ref('')
const description = ref('')
const purpose = ref('')
const fields = ref<FormFieldInput[]>([])
const loading = ref(false)
const saving = ref(false)
const previewOpen = ref(false)

const previewFields = computed<FormField[]>(() => {
  const parsed: FormField[] = []
  fields.value.forEach((field, index) => {
    if (field.label.trim() === '') {
      return
    }
    if (isChoiceFieldType(field.type)) {
      const options = (field.options ?? [])
        .filter((option) => option.label.trim() !== '')
        .map((option, optionIndex) => ({
          option_id: option.option_id ?? `preview_opt_${index}_${optionIndex}`,
          label: option.label,
          hidden_for_new: option.hidden_for_new ?? false,
        }))
      const result = FormFieldSchema.safeParse({
        field_id: field.field_id ?? `preview_${index}`,
        type: field.type,
        label: field.label,
        description: field.description ?? '',
        required: field.required,
        hidden_for_new: field.hidden_for_new ?? false,
        options,
      })
      if (result.success) {
        parsed.push(result.data)
      }
      return
    }
    const result = FormFieldSchema.safeParse({
      field_id: field.field_id ?? `preview_${index}`,
      type: field.type,
      label: field.label,
      description: field.description ?? '',
      required: field.required,
      hidden_for_new: field.hidden_for_new ?? false,
    })
    if (result.success) {
      parsed.push(result.data)
    }
  })
  return parsed
})

const load = async () => {
  if (props.formId == null || communityId.value === '') {
    return
  }
  loading.value = true
  try {
    const response = await getCommunityForm({ community_id: communityId.value, form_id: props.formId })
    name.value = response.data.form.name
    description.value = response.data.form.description
    purpose.value = response.data.form.purpose
    fields.value = response.data.form.fields
  } catch {
    notification.show($t('manage.forms.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => [communityId.value, props.formId],
  () => {
    void load()
  },
  { immediate: true },
)

const save = async () => {
  if (communityId.value === '' || name.value.trim() === '') {
    return
  }
  saving.value = true
  try {
    if (props.formId == null) {
      await createCommunityForm({
        community_id: communityId.value,
        name: name.value.trim(),
        description: description.value,
        purpose: purpose.value,
        fields: fields.value,
      })
      notification.show($t('manage.forms.saved'), 'success')
      void router.replace(getManageCommunityFormsPath(communityAccount))
    } else {
      await updateCommunityForm({
        community_id: communityId.value,
        form_id: props.formId,
        name: name.value.trim(),
        description: description.value,
        purpose: purpose.value,
        fields: fields.value,
      })
      notification.show($t('manage.forms.saved'), 'success')
      void router.push(getManageCommunityFormsPath(communityAccount))
    }
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}

const back = () => {
  void router.push(getManageCommunityFormsPath(communityAccount))
}
</script>

<template>
  <v-container class="manage-container">
    <v-btn variant="text" class="mb-4" @click="back">{{ $t('manage.forms.back_to_list') }}</v-btn>
    <div class="text-h6 mb-4">{{ formId == null ? $t('manage.forms.create') : $t('manage.forms.edit') }}</div>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-text-field v-model="name" :label="$t('manage.forms.name')" :maxlength="FORM_FIELD_LIMITS.maxName" class="mb-2" />
    <v-textarea v-model="description" :label="$t('manage.forms.description')" :maxlength="FORM_FIELD_LIMITS.maxDescription" rows="2" class="mb-2" />
    <v-textarea
      v-model="purpose"
      :label="$t('manage.forms.purpose')"
      :hint="$t('manage.forms.purpose_hint')"
      persistent-hint
      :maxlength="FORM_FIELD_LIMITS.maxPurpose"
      rows="2"
      class="mb-6"
    />
    <FormFieldsEditor v-model="fields" />
    <div class="d-flex ga-3 mt-6">
      <v-btn color="primary" :loading="saving" @click="save">{{ $t('manage.forms.save') }}</v-btn>
      <v-btn variant="outlined" @click="previewOpen = true">{{ $t('manage.forms.preview') }}</v-btn>
    </div>
    <v-dialog v-model="previewOpen" max-width="720">
      <v-card>
        <v-card-title>{{ $t('manage.forms.preview') }}</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">{{ $t('manage.forms.preview_notice') }}</v-alert>
          <div v-if="purpose !== ''" class="mb-4">{{ purpose }}</div>
          <FormAnswerFields :fields="previewFields" :model-value="[]" disabled />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="previewOpen = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
