<script setup lang="ts">
import { downloadCsvTemplate, parseCsvText } from '@/utils/csv'
import { mdiDownload, mdiUpload } from '@mdi/js'

const props = defineProps<{
  description: string
  templateFilename: string
  templateHeaders: string[]
  previewHeaders: string[]
  resultHeaders: { title: string; key: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  execute: [rows: string[][]]
  reset: []
}>()

type ResultRow = {
  row: number
  label: string
  status: 'success' | 'error'
  error_message?: string
}

const previewRows = ref<string[][]>([])
const rowErrors = ref<Map<number, string>>(new Map())
const results = ref<ResultRow[]>([])
const phase = ref<'upload' | 'preview' | 'result'>('upload')
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleDownloadTemplate = () => {
  downloadCsvTemplate(props.templateFilename, props.templateHeaders)
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file == null) return

  const text = await file.text()
  const rows = parseCsvText(text)
  if (rows.length === 0) {
    rowErrors.value = new Map([[1, 'CSVが空です']])
    previewRows.value = []
    phase.value = 'preview'
    return
  }

  const header = rows[0] ?? []
  if (header.join(',') !== props.templateHeaders.join(',')) {
    rowErrors.value = new Map([[1, 'ヘッダー行がテンプレートと一致しません']])
    previewRows.value = rows.slice(1)
    phase.value = 'preview'
    return
  }

  previewRows.value = rows.slice(1)
  rowErrors.value = new Map()
  phase.value = 'preview'
  input.value = ''
}

const handleExecute = () => {
  emit('execute', previewRows.value)
}

const showResults = (items: ResultRow[]) => {
  results.value = items
  phase.value = 'result'
}

const handleReset = () => {
  previewRows.value = []
  rowErrors.value = new Map()
  results.value = []
  phase.value = 'upload'
  emit('reset')
}

defineExpose({ showResults, setRowErrors: (errors: Map<number, string>) => (rowErrors.value = errors) })
</script>

<template>
  <v-card class="mb-6">
    <v-card-text>
      <p class="text-body-1 mb-4">{{ description }}</p>
      <div class="d-flex flex-wrap ga-3 mb-4">
        <v-btn variant="outlined" :prepend-icon="mdiDownload" @click="handleDownloadTemplate">
          {{ $t('admin.csv.download_template') }}
        </v-btn>
        <v-btn variant="tonal" :prepend-icon="mdiUpload" @click="fileInputRef?.click()">
          {{ $t('admin.csv.upload') }}
        </v-btn>
        <input ref="fileInputRef" type="file" accept=".csv,text/csv" hidden @change="handleFileChange" />
      </div>

      <v-table v-if="phase === 'preview' && previewRows.length > 0" density="compact" class="mb-4">
        <thead>
          <tr>
            <th>{{ $t('admin.csv.row') }}</th>
            <th v-for="header in previewHeaders" :key="header">{{ header }}</th>
            <th>{{ $t('admin.csv.validation') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in previewRows"
            :key="index"
            :class="{ 'bg-error-lighten-5': rowErrors.has(index + 1) }"
          >
            <td>{{ index + 1 }}</td>
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
            <td class="text-error">{{ rowErrors.get(index + 1) ?? '' }}</td>
          </tr>
        </tbody>
      </v-table>

      <div v-if="phase === 'preview'" class="d-flex ga-3">
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="previewRows.length === 0 || rowErrors.size > 0"
          @click="handleExecute"
        >
          {{ $t('admin.csv.execute') }}
        </v-btn>
        <v-btn variant="text" @click="handleReset">{{ $t('admin.csv.reset') }}</v-btn>
      </div>

      <v-table v-if="phase === 'result'" density="compact" class="mb-4">
        <thead>
          <tr>
            <th v-for="header in resultHeaders" :key="header.key">{{ header.title }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in results" :key="result.row">
            <td>{{ result.row }}</td>
            <td>{{ result.label }}</td>
            <td>
              <v-chip :color="result.status === 'success' ? 'success' : 'error'" size="small">
                {{ result.status === 'success' ? $t('admin.csv.success') : $t('admin.csv.error') }}
              </v-chip>
            </td>
            <td>{{ result.error_message ?? '' }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-btn v-if="phase === 'result'" variant="outlined" @click="handleReset">{{
        $t('admin.csv.import_again')
      }}</v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bg-error-lighten-5 {
  background-color: rgba(var(--v-theme-error), 0.08);
}
</style>
