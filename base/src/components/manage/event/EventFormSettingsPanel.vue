<script setup lang="ts">
import FormFieldsEditor from '@shokujii/base/components/forms/FormFieldsEditor.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification.js'
import {
  clearEventFormConfig,
  getEventFormConfig,
  listCommunityForms,
  setEventFormFromCommunity,
  updateEventFormConfig,
} from '@shokujii/base/apis/form.js'
import type { CommunityFormSummary, EventFormConfigDto, FormFieldInput } from '@shokujii/common/apis/form.js'
import { isEventFormEditableStatus } from '@shokujii/common/schemas/formFields.js'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'

const props = defineProps<{
  event: BokudeliEvent
}>()

const { t: $t } = useI18n()
const notification = useNotification()

const config = ref<EventFormConfigDto | null>(null)
const forms = ref<CommunityFormSummary[]>([])
const selectedFormId = ref('')
const purpose = ref('')
const fields = ref<FormFieldInput[]>([])
const loading = ref(false)
const saving = ref(false)
const clearConfirmOpen = ref(false)

const isEnterprise = computed(() => props.event.enterprise_id != null && props.event.enterprise_id !== '')
const editable = computed(() => isEventFormEditableStatus(props.event.event_status.value))

const load = async () => {
  if (isEnterprise.value) {
    return
  }
  loading.value = true
  try {
    const [configRes, formsRes] = await Promise.all([
      getEventFormConfig({ community_id: props.event.community_id, event_id: props.event.event_id }),
      listCommunityForms({ community_id: props.event.community_id }),
    ])
    config.value = configRes.data.config
    forms.value = formsRes.data.forms.filter((form) => !form.archived)
    purpose.value = configRes.data.config?.purpose ?? ''
    fields.value = configRes.data.config?.fields ?? []
    selectedFormId.value = configRes.data.config?.source_form_id ?? forms.value[0]?.form_id ?? ''
  } catch {
    notification.show($t('manage.forms.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.event.event_id,
  () => {
    void load()
  },
  { immediate: true },
)

const applyCommunityForm = async () => {
  if (selectedFormId.value === '') {
    return
  }
  saving.value = true
  try {
    const response = await setEventFormFromCommunity({
      community_id: props.event.community_id,
      event_id: props.event.event_id,
      form_id: selectedFormId.value,
    })
    config.value = response.data.config
    purpose.value = response.data.config.purpose
    fields.value = response.data.config.fields
    notification.show($t('manage.forms.saved'), 'success')
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}

const saveFields = async () => {
  saving.value = true
  try {
    const response = await updateEventFormConfig({
      community_id: props.event.community_id,
      event_id: props.event.event_id,
      purpose: purpose.value,
      fields: fields.value,
    })
    config.value = response.data.config
    notification.show($t('manage.forms.saved'), 'success')
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}

const requestClear = () => {
  clearConfirmOpen.value = true
}

const clear = async () => {
  saving.value = true
  try {
    await clearEventFormConfig({
      community_id: props.event.community_id,
      event_id: props.event.event_id,
    })
    config.value = null
    purpose.value = ''
    fields.value = []
    notification.show($t('manage.forms.saved'), 'success')
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  } finally {
    saving.value = false
    clearConfirmOpen.value = false
  }
}
</script>

<template>
  <div>
    <v-alert v-if="isEnterprise" type="info" variant="tonal">{{ $t('manage.forms.enterprise_unsupported') }}</v-alert>
    <v-alert v-else-if="!editable" type="info" variant="tonal" class="mb-4">{{
      $t('manage.forms.event_not_editable')
    }}</v-alert>
    <template v-else>
      <v-progress-linear v-if="loading" indeterminate class="mb-4" />
      <div class="d-flex flex-wrap ga-3 align-center mb-4">
        <v-select
          v-model="selectedFormId"
          :items="forms"
          item-title="name"
          item-value="form_id"
          :label="$t('manage.forms.select_form')"
          hide-details
          style="min-width: 240px"
        />
        <v-btn color="primary" :loading="saving" :disabled="selectedFormId === ''" @click="applyCommunityForm">
          {{ config == null ? $t('manage.forms.set_to_event') : $t('manage.forms.replace_event') }}
        </v-btn>
        <v-btn v-if="config != null" variant="outlined" :loading="saving" @click="requestClear">
          {{ $t('manage.forms.clear_event') }}
        </v-btn>
      </div>
      <v-alert v-if="config == null" type="info" variant="tonal">{{ $t('manage.forms.no_event_form') }}</v-alert>
      <template v-else>
        <v-textarea v-model="purpose" :label="$t('manage.forms.purpose')" rows="2" class="mb-4" />
        <div class="text-subtitle-1 mb-2">{{ $t('manage.forms.event_fields') }}</div>
        <FormFieldsEditor v-model="fields" />
        <v-btn class="mt-4" color="primary" :loading="saving" @click="saveFields">{{ $t('manage.forms.save') }}</v-btn>
      </template>
    </template>
    <ConfirmDialog v-model="clearConfirmOpen" :is-confirm="true" :ok-click="clear" :ok-loading-state="saving">
      {{ $t('manage.forms.clear_confirm') }}
    </ConfirmDialog>
  </div>
</template>
