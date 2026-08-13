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

const formatRemainingCell = (amount: number | null) => (amount == null ? '—' : formatYen(amount))

const perOrderSubsidyLabel = computed(() => {
  const settings = data.value?.settings
  if (settings == null) {
    return ''
  }
  if (settings.discountType === 'fixed') {
    return $t('user_profile.usage.settings_per_order_fixed', [priceString(settings.discountValue)])
  }
  return $t('user_profile.usage.settings_per_order_percentage', [settings.discountValue])
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
  <v-card v-else elevation="1" variant="outlined" color="surface" class="profile-panel-card usage-panel-card mb-6">
    <v-card-title class="profile-section-card-title py-4">
      <span class="profile-section-title">{{ $t('user_profile.usage.title') }}</span>
    </v-card-title>
    <v-card-text class="pt-0">
      <div class="usage-settings-block mb-5">
        <div class="text-subtitle-2 font-weight-medium mb-3">{{ $t('user_profile.usage.settings_title') }}</div>
        <div class="usage-settings-grid">
          <div class="usage-settings-item">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.settings_monthly_limit') }}</div>
            <div class="text-h4 font-weight-medium mt-1 usage-settings-amount">
              {{ formatYen(data.settings.monthlyLimit) }}
            </div>
          </div>
          <div class="usage-settings-item">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.settings_per_order') }}</div>
            <div class="text-h4 font-weight-medium mt-1 usage-settings-amount">{{ perOrderSubsidyLabel }}</div>
          </div>
        </div>
      </div>

      <div v-if="data.history.length === 0" class="text-body-2 text-medium-emphasis mb-4">
        {{ $t('user_profile.usage.history_empty') }}
      </div>
      <v-table v-else density="comfortable" class="usage-history-table mb-4">
        <thead>
          <tr>
            <th class="text-left">{{ $t('user_profile.usage.history_year_month') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.company_subsidy') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.user_paid') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.history_remaining') }}</th>
            <th class="text-right">{{ $t('user_profile.usage.order_count') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.history" :key="row.yearMonth">
            <td>
              <span>{{ formatYearMonthLabel(row.yearMonth) }}</span>
              <v-chip
                v-if="row.yearMonth === data.currentMonth"
                size="x-small"
                color="primary"
                variant="tonal"
                class="ml-2 usage-current-month-chip"
                label
              >
                {{ $t('user_profile.usage.current_month_badge') }}
              </v-chip>
            </td>
            <td class="text-right">{{ formatYen(row.used) }}</td>
            <td class="text-right">{{ formatYen(row.userPaid) }}</td>
            <td class="text-right">{{ formatRemainingCell(row.remaining) }}</td>
            <td class="text-right">{{ row.orderMenuCount }}</td>
          </tr>
        </tbody>
      </v-table>

      <p class="usage-footnotes pre-line mb-0">{{ $t('user_profile.usage.footnotes') }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import '@shokujii/base/components/profile/userProfilePanel.scss';

.usage-panel-card {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
}

.usage-history-table {
  th {
    font-weight: 600;
    white-space: nowrap;
    background-color: rgba(var(--v-theme-on-surface), 0.04);
  }
}

.usage-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}

.usage-settings-item {
  min-width: 0;
}

.usage-settings-block {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.usage-settings-amount {
  line-height: 1.25;
}

.usage-footnotes {
  font-size: 0.6875rem;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.usage-current-month-chip {
  vertical-align: middle;
}
</style>
