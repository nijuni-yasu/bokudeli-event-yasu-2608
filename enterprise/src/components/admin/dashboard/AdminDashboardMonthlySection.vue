<script setup lang="ts">
import type { DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import VueApexCharts from 'vue3-apexcharts'
import { mdiDownload } from '@mdi/js'
import { downloadMonthlyDashboardCsv } from '@/utils/adminDashboardCsv'
import { isCurrentCalendarMonth } from '@/utils/adminDashboardPeriod'

const props = defineProps<{
  rows: DashboardMonthlyRow[]
  loading: boolean
}>()

const { t } = useI18n()

const chartMetric = ref<'session_count' | 'total_amount'>('session_count')

const formatYen = (amount: number) => `${priceString(amount)}円`

const billingStatusLabel = (row: DashboardMonthlyRow) =>
  row.billing_status === 'provisional' ? t('admin.dashboard.billing_provisional') : t('admin.dashboard.billing_final')

const chartCategories = computed(() => props.rows.map((row) => row.year_month))

const chartSeries = computed(() => [
  {
    name:
      chartMetric.value === 'session_count'
        ? t('admin.dashboard.chart_session_count')
        : t('admin.dashboard.chart_total_amount'),
    data: props.rows.map((row) => (chartMetric.value === 'session_count' ? row.session_count : row.total_amount)),
  },
])

const chartOptions = computed(() => ({
  chart: { type: 'bar' as const, toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: chartCategories.value },
  yaxis: {
    labels: {
      formatter: (value: number) =>
        chartMetric.value === 'session_count' ? String(Math.round(value)) : formatYen(Math.round(value)),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) =>
        chartMetric.value === 'session_count' ? `${value}${t('admin.dashboard.unit_sessions')}` : formatYen(value),
    },
  },
}))

const downloadCsv = () => {
  downloadMonthlyDashboardCsv(props.rows)
}
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="d-flex flex-wrap align-center ga-3">
      <span>{{ $t('admin.dashboard.monthly_title') }}</span>
      <v-spacer />
      <v-btn
        variant="outlined"
        :prepend-icon="mdiDownload"
        :disabled="loading || rows.length === 0"
        @click="downloadCsv"
      >
        {{ $t('admin.dashboard.download_csv') }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert type="info" variant="tonal" class="mb-4" density="comfortable">
        {{ $t('admin.dashboard.monthly_note') }}
      </v-alert>

      <v-btn-toggle v-model="chartMetric" mandatory divided color="primary" class="mb-4">
        <v-btn value="session_count">{{ $t('admin.dashboard.chart_session_count') }}</v-btn>
        <v-btn value="total_amount">{{ $t('admin.dashboard.chart_total_amount') }}</v-btn>
      </v-btn-toggle>

      <div v-if="loading" class="py-8">
        <v-progress-linear indeterminate color="primary" />
      </div>
      <VueApexCharts
        v-else-if="rows.length > 0"
        type="bar"
        height="320"
        :options="chartOptions"
        :series="chartSeries"
      />
      <div v-else class="text-body-2 text-medium-emphasis py-8 text-center">
        {{ $t('admin.dashboard.no_data') }}
      </div>

      <v-table v-if="rows.length > 0" class="mt-6">
        <thead>
          <tr>
            <th>{{ $t('admin.dashboard.col_year_month') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_session_count') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_unique_users') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_total_amount') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_enterprise_subsidy') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_user_paid') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_enterprise_billing') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_active_accounts') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_platform_fee') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_total_billing') }}</th>
            <th>{{ $t('admin.dashboard.col_billing_status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.year_month">
            <td>
              {{ row.year_month }}
              <v-chip
                v-if="isCurrentCalendarMonth(row.year_month)"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-2"
              >
                {{ $t('admin.dashboard.provisional_chip') }}
              </v-chip>
            </td>
            <td class="text-right">{{ row.session_count }}</td>
            <td class="text-right">{{ row.unique_users }}</td>
            <td class="text-right">{{ formatYen(row.total_amount) }}</td>
            <td class="text-right">{{ formatYen(row.enterprise_subsidy_amount) }}</td>
            <td class="text-right">{{ formatYen(row.user_paid_amount) }}</td>
            <td class="text-right">{{ formatYen(row.enterprise_billing_amount) }}</td>
            <td class="text-right">{{ row.active_account_count }}</td>
            <td class="text-right">{{ formatYen(row.platform_fee_amount) }}</td>
            <td class="text-right">{{ formatYen(row.total_billing_amount) }}</td>
            <td>{{ billingStatusLabel(row) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
