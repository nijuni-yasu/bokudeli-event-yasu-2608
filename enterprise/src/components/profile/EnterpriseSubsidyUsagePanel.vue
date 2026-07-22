<script setup lang="ts">
import { priceString } from '@shokujii/base/schemes/converter'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import {
  fetchEnterpriseMemberMonthlyUsage,
  type EnterpriseMemberMonthlyUsageView,
} from '@/composable/enterpriseMemberMonthlyUsage.js'

const { t: $t } = useI18n()
const { user: loginUser } = storeToRefs(useCurrentUserStore())

const loading = ref(true)
const error = ref(false)
const data = ref<EnterpriseMemberMonthlyUsageView | null>(null)

const formatYen = (amount: number) => `${priceString(amount)}円`

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
  <template v-else>
    <v-card elevation="2" class="profile-panel-card mb-4">
      <v-card-title class="profile-section-card-title py-4">
        <span class="profile-section-title">{{ $t('user_profile.usage.title') }}</span>
      </v-card-title>
      <v-card-text class="pt-0">
        <div class="profile-stats-summary mb-4">
          <div class="profile-stats-item text-center">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.current_used') }}</div>
            <div class="profile-stat-value text-h5 font-weight-medium mt-1">{{ formatYen(data.used) }}</div>
          </div>
          <div class="profile-stats-item text-center">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.current_limit') }}</div>
            <div class="profile-stat-value text-h5 font-weight-medium mt-1">{{ formatYen(data.limit) }}</div>
          </div>
          <div class="profile-stats-item text-center">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.current_remaining') }}</div>
            <div class="profile-stat-value text-h5 font-weight-medium mt-1">{{ formatYen(data.remaining) }}</div>
          </div>
          <div class="profile-stats-item text-center">
            <div class="text-body-2 text-medium-emphasis">{{ $t('user_profile.usage.order_menu_count') }}</div>
            <div class="profile-stat-value text-h5 font-weight-medium mt-1">{{ data.orderMenuCount }}</div>
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ $t('user_profile.usage.event_month_note') }}</p>
      </v-card-text>
    </v-card>

    <v-card elevation="2" class="profile-panel-card">
      <v-card-title class="profile-section-card-title py-4">
        <span class="profile-section-title">{{ $t('user_profile.usage.history_title') }}</span>
      </v-card-title>
      <v-card-text class="pt-0">
        <div v-if="data.history.length === 0" class="text-body-2 text-medium-emphasis">
          {{ $t('user_profile.usage.history_empty') }}
        </div>
        <v-table v-else density="comfortable" class="usage-history-table">
          <thead>
            <tr>
              <th class="text-left">{{ $t('user_profile.usage.history_year_month') }}</th>
              <th class="text-right">{{ $t('user_profile.usage.history_used') }}</th>
              <th class="text-right">{{ $t('user_profile.usage.order_menu_count') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.history" :key="row.yearMonth">
              <td>{{ row.yearMonth }}</td>
              <td class="text-right">{{ formatYen(row.used) }}</td>
              <td class="text-right">{{ row.orderMenuCount }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </template>
</template>

<style scoped lang="scss">
.usage-history-table {
  th {
    font-weight: 600;
    white-space: nowrap;
  }
}
</style>
