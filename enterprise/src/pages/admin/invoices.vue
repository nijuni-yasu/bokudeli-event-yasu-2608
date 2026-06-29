<script setup lang="ts">
import type { DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { getDashboardMonthlyData } from '@/apis/dashboard'
import AdminDashboardPeriodPicker from '@/components/admin/dashboard/AdminDashboardPeriodPicker.vue'
import AdminInvoicesTable from '@/components/admin/AdminInvoicesTable.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { getDefaultDashboardPeriod, validateDashboardPeriod, type DashboardPeriod } from '@/utils/adminDashboardPeriod'

const { t } = useI18n()
const notification = useNotification()

const loading = ref(false)
const enterpriseId = ref<string>()
const period = ref<DashboardPeriod>(getDefaultDashboardPeriod())
const periodError = computed(() => validateDashboardPeriod(period.value))
const rows = ref<DashboardMonthlyRow[]>([])
let loadSeq = 0

const loadInvoices = async () => {
  if (enterpriseId.value == null) return
  if (periodError.value != null) return
  const seq = ++loadSeq
  loading.value = true
  try {
    const result = await getDashboardMonthlyData({
      enterprise_id: enterpriseId.value,
      start_year_month: period.value.start_year_month,
      end_year_month: period.value.end_year_month,
    })
    if (seq !== loadSeq) return
    rows.value = [...result.data.rows].sort((a, b) => b.year_month.localeCompare(a.year_month))
  } catch {
    if (seq !== loadSeq) return
    notification.show(t('admin.invoices.load_failed'), 'error')
  } finally {
    if (seq === loadSeq) {
      loading.value = false
    }
  }
}

onMounted(async () => {
  enterpriseId.value = await getEnterpriseIdFromToken()
  await loadInvoices()
})

watch(
  period,
  () => {
    loadInvoices()
  },
  { deep: true },
)
</script>

<template>
  <v-container>
    <AdminPageHeader :title="$t('admin.invoices.title')" />

    <AdminDashboardPeriodPicker v-model="period" />

    <AdminInvoicesTable :rows="rows" :loading="loading" />
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
