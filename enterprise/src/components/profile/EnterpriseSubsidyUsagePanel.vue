<script setup lang="ts">
import { computed } from 'vue'
import { priceString } from '@shokujii/base/schemes/converter'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import {
  fetchEnterpriseMemberMonthlyUsage,
  type EnterpriseMemberMonthlyUsageView,
} from '@/composable/enterpriseMemberMonthlyUsage.js'
import { formatYearMonthLabel } from '@/composable/enterpriseMemberMonthlyUsageHistory.js'

const { t: $t } = useI18n()
const { user: loginUser } = storeToRefs(useCurrentUserStore())

const loading = ref(true)
const error = ref(false)
const data = ref<EnterpriseMemberMonthlyUsageView | null>(null)

const formatYen = (amount: number) => `${priceString(amount)}円`

const currentMonthLabel = computed(() =>
  data.value != null ? formatYearMonthLabel(data.value.currentMonth) : '',
)

const usageProgressPercent = computed(() => {
  if (data.value == null || data.value.limit <= 0) {
    return 0
  }
  return Math.min(100, Math.round((data.value.used / data.value.limit) * 100))
})

const load = async () => {
  const uid = loginUser.value?.user_id
  if (uid == null) {
    loading.value = false
    error.value = true
    return
  }
  loading.value = true
  error.value = false
  try {
    const result = await fetchEnterpriseMemberMonthlyUsage(uid)
    if (result == null) {
      error.value = true
      data.value = null
    } else {
      data.value = result
    }
  } catch {
    error.value = true
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div v-if="loading" class="d-flex justify-center pa-6">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="error || data == null" class="text-body-1 text-medium-emphasis pa-6">
    {{ $t('user_profile.usage.load_failed') }}
  </div>
  <v-card v-else elevation="2" class="profile-panel-card">
    <v-card-title class="profile-section-card-title py-4">
      <span class="profile-section-title">{{ $t('user_profile.usage.title') }}</span>
    </v-card-title>
    <v-card-text class="pt-0">
      <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('user_profile.usage.event_month_note') }}</p>

      <div class="usage-current-block mb-6">
        <div class="text-subtitle-1 font-weight-medium mb-3">
          {{ $t('user_profile.usage.current_month_heading', [currentMonthLabel]) }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-1">{{ $t('user_profile.usage.current_remaining') }}</div>
        <div class="text-h4 font-weight-medium mb-3">{{ formatYen(data.remaining) }}</div>
        <v-progress-linear
          :model-value="usageProgressPercent"
          color="primary"
          height="8"
          rounded
          class="mb-2"
          :aria-label="$t('user_profile.usage.usage_progress_aria', [currentMonthLabel])"
        />
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{
            $t('user_profile.usage.current_usage_vs_limit', [
              formatYen(data.used),
              formatYen(data.limit),
            ])
          }}
        </div>
        <div class="profile-stats-summary mb-2">
          <div class="profile-stats-item">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.company_subsidy') }}</div>
            <div class="text-h6 font-weight-medium mt-1">{{ formatYen(data.used) }}</div>
          </div>
          <div class="profile-stats-item">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.user_paid') }}</div>
            <div class="text-h6 font-weight-medium mt-1">{{ formatYen(data.userPaid) }}</div>
          </div>
          <div class="profile-stats-item">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.order_menu_count') }}</div>
            <div class="text-h6 font-weight-medium mt-1">{{ data.orderMenuCount }}</div>
          </div>
        </div>
        <p class="text-caption text-medium-emphasis mb-0">{{ $t('user_profile.usage.current_limit_note') }}</p>
      </div>

      <div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('user_profile.usage.history_title') }}</div>
      <div v-if="data.history.length === 0" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.usage.history_empty') }}
      </div>
      <v-table v-else density="comfortable" class="usage-history-table">
        <thead>
          <tr>
            <th class="text-left">{{ $t('user_profile.usage.history_year_month') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.company_subsidy') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.user_paid') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.order_menu_count') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data.history"
            :key="row.yearMonth"
            :class="{ 'usage-history-row--current': row.yearMonth === data.currentMonth }"
          >
            <td>{{ formatYearMonthLabel(row.yearMonth) }}</td>
            <td class="text-right">{{ formatYen(row.used) }}</td>
            <td class="text-right">{{ formatYen(row.userPaid) }}</td>
            <td class="text-right">{{ row.orderMenuCount }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import '@shokujii/base/components/profile/userProfilePanel.scss';

.usage-history-table {
  th {
    font-weight: 600;
    white-space: nowrap;
  }
}

.usage-history-row--current {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.usage-current-block {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
