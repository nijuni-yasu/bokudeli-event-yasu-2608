<script setup lang="ts">
import type { DashboardMemberRow, DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { getDashboardMemberData, getDashboardMonthlyData } from '@/apis/dashboard'
import AdminDashboardMemberSection from '@/components/admin/dashboard/AdminDashboardMemberSection.vue'
import AdminDashboardMonthlySection from '@/components/admin/dashboard/AdminDashboardMonthlySection.vue'
import AdminDashboardPeriodPicker from '@/components/admin/dashboard/AdminDashboardPeriodPicker.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { getDefaultDashboardPeriod, validateDashboardPeriod, type DashboardPeriod } from '@/utils/adminDashboardPeriod'

const { t } = useI18n()
const notification = useNotification()

const loading = ref(false)
const enterpriseId = ref<string>()
const period = ref<DashboardPeriod>(getDefaultDashboardPeriod())
const periodError = computed(() => validateDashboardPeriod(period.value))
const monthlyRows = ref<DashboardMonthlyRow[]>([])
const memberRows = ref<DashboardMemberRow[]>([])
let loadSeq = 0

const loadDashboard = async () => {
  if (enterpriseId.value == null) return
  if (periodError.value != null) {
    monthlyRows.value = []
    memberRows.value = []
    return
  }
  const seq = ++loadSeq
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
    if (seq !== loadSeq) return
    monthlyRows.value = monthlyResult.data.rows
    memberRows.value = memberResult.data.rows
  } catch {
    if (seq !== loadSeq) return
    monthlyRows.value = []
    memberRows.value = []
    notification.show(t('admin.dashboard.load_failed'), 'error')
  } finally {
    if (seq === loadSeq) {
      loading.value = false
    }
  }
}

onMounted(async () => {
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
  } catch {
    notification.show(t('admin.dashboard.load_failed'), 'error')
  }
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
  <v-container>
    <AdminPageHeader :title="$t('admin.dashboard.title')" />

    <AdminDashboardPeriodPicker v-model="period" />

    <AdminDashboardMonthlySection :rows="monthlyRows" :loading="loading" />

    <AdminDashboardMemberSection
      :rows="memberRows"
      :loading="loading"
      :start-year-month="period.start_year_month"
      :end-year-month="period.end_year_month"
    />
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
