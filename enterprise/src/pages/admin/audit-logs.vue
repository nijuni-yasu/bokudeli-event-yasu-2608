<script setup lang="ts">
import type { AuditLogListItem } from '@shokujii/common/apis/auditLog.js'
import type { EnterpriseMemberListItem } from '@shokujii/common/apis/enterprise.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { convertToDatetime } from '@shokujii/common/utils/datetime.js'
import { getEnterpriseAuditLogs } from '@/apis/auditLog'
import { getEnterpriseMembers } from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'

const AUDIT_LOG_ACTIONS = [
  'login',
  'logout',
  'session_timeout',
  'account_create',
  'account_disable',
  'account_enable',
  'member_update',
  'role_change',
  'community_approve',
  'community_reject',
  'community_create',
  'enterprise_create',
  'settings_update',
  'discount_update',
  'order_create',
  'order_cancel',
  'monthly_usage_exceeded',
  'enterprise_subsidy_recalculated',
  'event_auto_cancel',
] as const

type ActorFilterType = 'all' | 'system' | 'guest' | 'member'

const { t, te } = useI18n()
const notification = useNotification()

const loading = ref(false)
const enterpriseId = ref<string>()
const items = ref<AuditLogListItem[]>([])
const memberOptions = ref<EnterpriseMemberListItem[]>([])

const actionFilter = ref<string>('all')
const actorFilterType = ref<ActorFilterType>('all')
const selectedMemberId = ref<string>('')
const startDate = ref<string>('')
const endDate = ref<string>('')

const cursorStack = ref<string[]>([])
const currentCursor = ref<string | undefined>(undefined)
const nextCursor = ref<string | undefined>(undefined)
const hasNext = ref(false)
const hasPrev = computed(() => cursorStack.value.length > 0)

const showDetailDialog = ref(false)
const selectedLog = ref<AuditLogListItem | null>(null)

const actionOptions = computed(() => [
  { title: t('admin.audit_logs.filter_action_all'), value: 'all' },
  ...AUDIT_LOG_ACTIONS.map((action) => ({
    title: t(`admin.audit_logs.actions.${action}`),
    value: action,
  })),
])

const actorOptions = computed(() => [
  { title: t('admin.audit_logs.filter_actor_all'), value: 'all' as const },
  { title: t('admin.audit_logs.filter_actor_system'), value: 'system' as const },
  { title: t('admin.audit_logs.filter_actor_guest'), value: 'guest' as const },
  { title: t('admin.audit_logs.filter_actor_member'), value: 'member' as const },
])

const memberSelectOptions = computed(() =>
  memberOptions.value.map((member) => ({
    title: member.display_name,
    value: member.user_id,
  })),
)

const formatActionLabel = (action: string) => {
  const key = `admin.audit_logs.actions.${action}`
  return te(key) ? t(key) : action
}

const flattenDetails = (details: Record<string, unknown> | null | undefined): { key: string; value: string }[] => {
  if (details == null) {
    return []
  }
  const rows: { key: string; value: string }[] = []
  for (const [key, value] of Object.entries(details)) {
    if (value == null) {
      rows.push({ key, value: '—' })
      continue
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        rows.push({
          key: `${key}.${nestedKey}`,
          value: nestedValue == null ? '—' : String(nestedValue),
        })
      }
      continue
    }
    if (Array.isArray(value)) {
      rows.push({ key, value: value.join(', ') })
      continue
    }
    rows.push({ key, value: String(value) })
  }
  return rows
}

const detailRows = computed(() => flattenDetails(selectedLog.value?.details))

const buildActorFilter = () => {
  if (actorFilterType.value === 'all') {
    return 'all' as const
  }
  if (actorFilterType.value === 'system') {
    return 'system' as const
  }
  if (actorFilterType.value === 'guest') {
    return 'guest' as const
  }
  if (selectedMemberId.value === '') {
    return 'all' as const
  }
  return { user_id: selectedMemberId.value }
}

const loadAuditLogs = async (cursor?: string) => {
  if (enterpriseId.value == null) {
    return
  }
  loading.value = true
  try {
    const result = await getEnterpriseAuditLogs({
      enterprise_id: enterpriseId.value,
      action: actionFilter.value === 'all' ? undefined : actionFilter.value,
      actor_filter: buildActorFilter(),
      start_date: startDate.value !== '' ? startDate.value : undefined,
      end_date: endDate.value !== '' ? endDate.value : undefined,
      page_size: 50,
      cursor,
    })
    items.value = result.data.items
    hasNext.value = result.data.has_next
    nextCursor.value = result.data.next_cursor
  } catch {
    notification.show(t('admin.audit_logs.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

const resetPagination = () => {
  cursorStack.value = []
  currentCursor.value = undefined
}

const applyFilters = async () => {
  resetPagination()
  await loadAuditLogs()
}

const goNext = async () => {
  if (nextCursor.value == null) {
    return
  }
  cursorStack.value.push(currentCursor.value ?? '')
  currentCursor.value = nextCursor.value
  await loadAuditLogs(currentCursor.value)
}

const goPrev = async () => {
  if (cursorStack.value.length === 0) {
    return
  }
  const prev = cursorStack.value.pop()
  currentCursor.value = prev === '' ? undefined : prev
  await loadAuditLogs(currentCursor.value)
}

const openDetail = (log: AuditLogListItem) => {
  selectedLog.value = log
  showDetailDialog.value = true
}

onMounted(async () => {
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
    if (enterpriseId.value != null) {
      const membersResult = await getEnterpriseMembers({
        enterprise_id: enterpriseId.value,
        page: 1,
        page_size: 500,
        sort_by: 'display_name',
        sort_order: 'asc',
      })
      memberOptions.value = membersResult.data.members
    }
  } catch {
    // メンバー一覧はフィルタ選択肢のみに使うため、失敗してもログ一覧の取得は続行する
    notification.show(t('admin.audit_logs.load_failed'), 'error')
  }
  await loadAuditLogs()
})
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-6">{{ $t('admin.audit_logs.title') }}</h1>

    <v-card class="mb-6">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="actionFilter"
              :items="actionOptions"
              item-title="title"
              item-value="value"
              :label="$t('admin.audit_logs.filter_action')"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="actorFilterType"
              :items="actorOptions"
              item-title="title"
              item-value="value"
              :label="$t('admin.audit_logs.filter_actor')"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col v-if="actorFilterType === 'member'" cols="12" md="3">
            <v-select
              v-model="selectedMemberId"
              :items="memberSelectOptions"
              item-title="title"
              item-value="value"
              :label="$t('admin.audit_logs.filter_member')"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="startDate"
              type="date"
              :label="$t('admin.audit_logs.filter_start_date')"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="endDate"
              type="date"
              :label="$t('admin.audit_logs.filter_end_date')"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-btn color="primary" @click="applyFilters">{{ $t('admin.audit_logs.apply_filters') }}</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-progress-linear v-if="loading" indeterminate />

      <div class="overflow-x-auto">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>{{ $t('admin.audit_logs.col_timestamp') }}</th>
              <th>{{ $t('admin.audit_logs.col_action') }}</th>
              <th>{{ $t('admin.audit_logs.col_operator') }}</th>
              <th>{{ $t('admin.audit_logs.col_target') }}</th>
              <th>{{ $t('admin.audit_logs.col_detail') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && items.length === 0">
              <td colspan="5" class="text-center text-medium-emphasis py-8">
                {{ $t('admin.audit_logs.empty') }}
              </td>
            </tr>
            <tr v-for="log in items" :key="log.log_id">
              <td>{{ convertToDatetime(log.timestamp) }}</td>
              <td>{{ formatActionLabel(log.action) }}</td>
              <td>{{ log.operator_label }}</td>
              <td>{{ log.target_label }}</td>
              <td>
                <v-btn variant="text" size="small" @click="openDetail(log)">
                  {{ $t('admin.audit_logs.detail_button') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="!hasPrev || loading" @click="goPrev">
          {{ $t('admin.audit_logs.prev_page') }}
        </v-btn>
        <v-btn variant="text" :disabled="!hasNext || loading" @click="goNext">
          {{ $t('admin.audit_logs.next_page') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="showDetailDialog" max-width="640">
      <v-card v-if="selectedLog != null">
        <v-card-title>{{ $t('admin.audit_logs.detail_title') }}</v-card-title>
        <v-card-text>
          <dl class="audit-log-detail">
            <dt>{{ $t('admin.audit_logs.detail_timestamp') }}</dt>
            <dd>{{ convertToDatetime(selectedLog.timestamp) }}</dd>
            <dt>{{ $t('admin.audit_logs.detail_action') }}</dt>
            <dd>{{ formatActionLabel(selectedLog.action) }}</dd>
            <dt>{{ $t('admin.audit_logs.detail_operator') }}</dt>
            <dd>{{ selectedLog.operator_label }}</dd>
            <dt>{{ $t('admin.audit_logs.detail_target') }}</dt>
            <dd>{{ selectedLog.target_label }}</dd>
          </dl>

          <template v-if="detailRows.length > 0">
            <p class="text-subtitle-2 mt-4 mb-2">{{ $t('admin.audit_logs.detail_section') }}</p>
            <dl class="audit-log-detail">
              <template v-for="row in detailRows" :key="row.key">
                <dt>{{ row.key }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">{{ $t('admin.common.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.audit-log-detail {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
}

.audit-log-detail dt {
  font-weight: 600;
}

.audit-log-detail dd {
  margin: 0;
  word-break: break-word;
}
</style>

<route lang="yaml">
meta:
  layout: admin
</route>
