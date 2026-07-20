<script setup lang="ts">
import type { DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import { mdiDownload } from '@mdi/js'
import { getAdminInvoicePdfPath } from '@/router/utils'

defineProps<{
  rows: DashboardMonthlyRow[]
  loading: boolean
}>()

const formatYen = (amount: number) => `${priceString(amount)}円`

const canDownload = (row: DashboardMonthlyRow): boolean =>
  row.billing_status === 'final' && row.total_billing_amount > 0

const openPdf = (yearMonth: string) => {
  window.open(getAdminInvoicePdfPath(yearMonth), '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <v-card>
    <v-card-title>{{ $t('admin.invoices.table_title') }}</v-card-title>
    <v-card-text>
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else-if="rows.length === 0" class="text-body-2 text-medium-emphasis py-8 text-center">
        {{ $t('admin.invoices.no_data') }}
      </div>
      <div v-else class="overflow-x-auto">
        <v-table>
          <thead>
            <tr>
              <th>{{ $t('admin.invoices.col_year_month') }}</th>
              <th class="text-right">{{ $t('admin.invoices.col_active_accounts') }}</th>
              <th class="text-right">{{ $t('admin.invoices.col_platform_fee') }}</th>
              <th class="text-right">{{ $t('admin.invoices.col_meal_billing') }}</th>
              <th class="text-right">{{ $t('admin.invoices.col_total_billing') }}</th>
              <th>{{ $t('admin.invoices.col_status') }}</th>
              <th>{{ $t('admin.invoices.col_action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.year_month">
              <td>{{ row.year_month }}</td>
              <td class="text-right admin-tabular-nums">{{ row.active_account_count }}</td>
              <td class="text-right admin-tabular-nums">{{ formatYen(row.platform_fee_amount) }}</td>
              <td class="text-right admin-tabular-nums">{{ formatYen(row.enterprise_billing_amount) }}</td>
              <td class="text-right admin-tabular-nums">{{ formatYen(row.total_billing_amount) }}</td>
              <td>
                {{
                  row.billing_status === 'final'
                    ? $t('admin.invoices.status_final')
                    : $t('admin.invoices.status_provisional')
                }}
              </td>
              <td>
                <v-btn
                  v-if="canDownload(row)"
                  variant="text"
                  size="small"
                  density="compact"
                  :prepend-icon="mdiDownload"
                  @click="openPdf(row.year_month)"
                >
                  {{ $t('admin.invoices.download') }}
                </v-btn>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <p class="text-body-2 text-medium-emphasis mt-6 mb-0">
        {{ $t('admin.invoices.note') }}
      </p>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@use '@/styles/adminTable.scss';
</style>
