<script setup lang="ts">
import type { DashboardMemberRow, DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { getDashboardMemberData, getDashboardMonthlyData } from '@/apis/dashboard'
import AdminDashboardMemberSection from '@/components/admin/dashboard/AdminDashboardMemberSection.vue'
import AdminDashboardMonthlySection from '@/components/admin/dashboard/AdminDashboardMonthlySection.vue'
import AdminDashboardPeriodPicker from '@/components/admin/dashboard/AdminDashboardPeriodPicker.vue'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { getDefaultDashboardPeriod, type DashboardPeriod } from '@/utils/adminDashboardPeriod'

const { t } = useI18n()
const notification = useNotification()

const loading = ref(false)
const enterpriseId = ref<string>()
const period = ref<DashboardPeriod>(getDefaultDashboardPeriod())
const monthlyRows = ref<DashboardMonthlyRow[]>([])
const memberRows = ref<DashboardMemberRow[]>([])

const loadDashboard = async () => {
  if (enterpriseId.value == null) return
  loading.value = true
  try {
    const request = {
      enterprise_id: enterpriseId.value,
      start_year_month: period.value.start_year_month,
      end_year_month: period.value.end_year_month,
    }
    const [monthlyResult, memberResult] = await Promise.all([
      getDashboardMonthlyData(request),
      getDashboardMemberData(request),
    ])
    monthlyRows.value = monthlyResult.data.rows
    memberRows.value = memberResult.data.rows
  } catch {
    notification.show(t('admin.dashboard.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  enterpriseId.value = await getEnterpriseIdFromToken()
  await loadDashboard()
})

watch(
  period,
  () => {
    loadDashboard()
  },
  { deep: true },
)
</script>

<template>
  <div>
    <h1 class="text-h5 mb-4">{{ $t('admin.dashboard.title') }}</h1>

    <AdminDashboardPeriodPicker v-model="period" />

    <AdminDashboardMonthlySection :rows="monthlyRows" :loading="loading" />

    <AdminDashboardMemberSection
      :rows="memberRows"
      :loading="loading"
      :start-year-month="period.start_year_month"
      :end-year-month="period.end_year_month"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
