<script setup lang="ts">
import type { DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'
import { mdiDownload } from '@mdi/js'
import { downloadMonthlyDashboardCsv } from '@/utils/adminDashboardCsv'

const props = defineProps<{
  rows: DashboardMonthlyRow[]
  loading: boolean
}>()

const { t } = useI18n()
const theme = useTheme()

const showDetailColumns = ref(false)

const chartMetric = ref<'session_count' | 'total_amount'>('session_count')

const formatYen = (amount: number) => `${priceString(amount)}円`

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
  colors: [theme.current.value.colors.primary],
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
      <div class="chart-metric-toggle-wrap mb-4">
        <v-btn-toggle
          v-model="chartMetric"
          mandatory
          divided
          color="primary"
          density="comfortable"
          class="chart-metric-toggle w-100"
        >
          <v-btn value="session_count">{{ $t('admin.dashboard.chart_session_count') }}</v-btn>
          <v-btn value="total_amount">{{ $t('admin.dashboard.chart_total_amount') }}</v-btn>
        </v-btn-toggle>
      </div>

      <div v-if="loading" class="py-8">
        <v-progress-linear indeterminate color="primary" />
      </div>
      <VueApexCharts
        v-else-if="rows.length > 0"
        :key="chartMetric"
        type="bar"
        height="320"
        :options="chartOptions"
        :series="chartSeries"
      />
      <div v-else class="text-body-2 text-medium-emphasis py-8 text-center">
        {{ $t('admin.dashboard.no_data') }}
      </div>

      <div v-if="rows.length > 0" class="d-flex align-center justify-end mb-2 mt-6">
        <v-switch
          v-model="showDetailColumns"
          :label="$t('admin.dashboard.show_detail_columns')"
          hide-details
          density="compact"
        />
      </div>

      <div v-if="rows.length > 0" class="overflow-x-auto">
        <v-table class="mt-2">
          <thead>
            <tr>
              <th>{{ $t('admin.dashboard.col_year_month') }}</th>
              <th class="text-right">{{ $t('admin.dashboard.col_session_count') }}</th>
              <th class="text-right">{{ $t('admin.dashboard.col_unique_users') }}</th>
              <th class="text-right">{{ $t('admin.dashboard.col_total_amount') }}</th>
              <th v-if="showDetailColumns" class="text-right">
                {{ $t('admin.dashboard.col_enterprise_subsidy') }}
              </th>
              <th v-if="showDetailColumns" class="text-right">{{ $t('admin.dashboard.col_user_paid') }}</th>
              <th v-if="showDetailColumns" class="text-right">
                {{ $t('admin.dashboard.col_enterprise_billing') }}
              </th>
              <th v-if="showDetailColumns" class="text-right">
                {{ $t('admin.dashboard.col_active_accounts') }}
              </th>
              <th v-if="showDetailColumns" class="text-right">{{ $t('admin.dashboard.col_platform_fee') }}</th>
              <th class="text-right">{{ $t('admin.dashboard.col_total_billing') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.year_month">
              <td>{{ row.year_month }}</td>
              <td class="text-right admin-tabular-nums">{{ row.session_count }}</td>
              <td class="text-right admin-tabular-nums">{{ row.unique_users }}</td>
              <td class="text-right admin-tabular-nums">{{ formatYen(row.total_amount) }}</td>
              <td v-if="showDetailColumns" class="text-right admin-tabular-nums">
                {{ formatYen(row.enterprise_subsidy_amount) }}
              </td>
              <td v-if="showDetailColumns" class="text-right admin-tabular-nums">
                {{ formatYen(row.user_paid_amount) }}
              </td>
              <td v-if="showDetailColumns" class="text-right admin-tabular-nums">
                {{ formatYen(row.enterprise_billing_amount) }}
              </td>
              <td v-if="showDetailColumns" class="text-right admin-tabular-nums">{{ row.active_account_count }}</td>
              <td v-if="showDetailColumns" class="text-right admin-tabular-nums">
                {{ formatYen(row.platform_fee_amount) }}
              </td>
              <td class="text-right admin-tabular-nums">{{ formatYen(row.total_billing_amount) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
/* v-btn-group は inline-flex のため親幅を指定しないとボタンが潰れてラベルが重なる */
.chart-metric-toggle-wrap {
  width: 100%;
  max-width: 22rem;
}

.chart-metric-toggle {
  display: flex;
  width: 100%;

  :deep(.v-btn) {
    flex: 1 1 50%;
    min-width: 0;
    white-space: nowrap;
    padding-inline: 12px;
  }
}
</style>
