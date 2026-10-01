<script setup lang="ts">
import { useNotification } from '@shokujii/base/composable/notification.js'
import { listEventFormResponses } from '@shokujii/base/apis/form.js'
import { buildEventFormResponseCsv, downloadMemberCsv } from '@shokujii/base/composable/memberCsvExport.js'
import type { EventFormResponseFilter, EventFormResponseListItem } from '@shokujii/common/apis/form.js'
import { convertToDatetime } from '@shokujii/common/utils/datetime.js'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { mdiDownload } from '@mdi/js'

const props = defineProps<{
  event: BokudeliEvent
}>()

const { t: $t } = useI18n()
const notification = useNotification()

const filter = ref<EventFormResponseFilter>('confirmed')
const responses = ref<EventFormResponseListItem[]>([])
const loading = ref(false)
const selected = ref<EventFormResponseListItem | null>(null)

const load = async () => {
  if (props.event.enterprise_id != null && props.event.enterprise_id !== '') {
    return
  }
  loading.value = true
  try {
    const response = await listEventFormResponses({
      community_id: props.event.community_id,
      event_id: props.event.event_id,
      filter: filter.value,
    })
    responses.value = response.data.responses
  } catch {
    notification.show($t('manage.forms.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.event.event_id, filter.value],
  () => {
    void load()
  },
  { immediate: true },
)

const participationLabel = (value: EventFormResponseFilter) =>
  value === 'confirmed' ? $t('manage.forms.filter_confirmed') : $t('manage.forms.filter_canceled')

const download = () => {
  const csv = buildEventFormResponseCsv(
    responses.value.map((item) => ({
      user_id: item.user_id,
      display_name: item.display_name,
      participation_label: participationLabel(item.participation),
      answered_at: convertToDatetime(item.answered_at),
      updated_at: convertToDatetime(item.updated_at),
      answers: item.answers.map((answer) => ({
        field_label: answer.field_label,
        display_value: answer.display_value,
      })),
    })),
  )
  downloadMemberCsv($t('manage.forms.csv_filename'), csv)
}
</script>

<template>
  <div class="mt-10">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6">{{ $t('manage.forms.responses_title') }}</div>
      <div class="d-flex ga-2">
        <v-btn-toggle v-model="filter" mandatory density="compact" variant="outlined">
          <v-btn value="confirmed">{{ $t('manage.forms.filter_confirmed') }}</v-btn>
          <v-btn value="canceled">{{ $t('manage.forms.filter_canceled') }}</v-btn>
        </v-btn-toggle>
        <v-btn :prepend-icon="mdiDownload" variant="outlined" :disabled="responses.length === 0" @click="download">
          {{ $t('manage.forms.csv_download') }}
        </v-btn>
      </div>
    </div>
    <v-progress-linear v-if="loading" indeterminate />
    <v-alert v-else-if="responses.length === 0" type="info" variant="tonal">{{
      $t('manage.forms.responses_empty')
    }}</v-alert>
    <v-table v-else>
      <thead>
        <tr>
          <th>{{ $t('manage.forms.display_name') }}</th>
          <th>{{ $t('manage.forms.participation') }}</th>
          <th>{{ $t('manage.forms.answered_at') }}</th>
          <th>{{ $t('manage.forms.updated_at') }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in responses" :key="item.user_id">
          <td>{{ item.display_name }}</td>
          <td>{{ participationLabel(item.participation) }}</td>
          <td>{{ convertToDatetime(item.answered_at) }}</td>
          <td>{{ convertToDatetime(item.updated_at) }}</td>
          <td class="text-right">
            <v-btn variant="text" size="small" @click="selected = item">{{ $t('manage.forms.detail') }}</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-dialog :model-value="selected != null" max-width="720" @update:model-value="selected = $event ? selected : null">
      <v-card v-if="selected != null">
        <v-card-title>{{ selected.display_name }}</v-card-title>
        <v-card-text>
          <div class="mb-2">{{ $t('manage.forms.user_id') }}: {{ selected.user_id }}</div>
          <div v-for="answer in selected.answers" :key="answer.field_id" class="mb-3">
            <div class="font-weight-medium">{{ answer.field_label }}</div>
            <div>{{ answer.display_value }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="selected = null">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
