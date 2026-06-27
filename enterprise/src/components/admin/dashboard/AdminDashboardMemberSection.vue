<script setup lang="ts">
import type { DashboardMemberRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import { mdiDownload } from '@mdi/js'
import { downloadMemberDashboardCsv } from '@/utils/adminDashboardCsv'

const props = defineProps<{
  rows: DashboardMemberRow[]
  loading: boolean
  startYearMonth: string
  endYearMonth: string
}>()

const formatYen = (amount: number) => `${priceString(amount)}円`

const downloadCsv = () => {
  downloadMemberDashboardCsv(props.rows, props.startYearMonth, props.endYearMonth)
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex flex-wrap align-center ga-3">
      <span>{{ $t('admin.dashboard.member_title') }}</span>
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
      <div v-if="loading" class="py-8">
        <v-progress-linear indeterminate color="primary" />
      </div>
      <div v-else-if="rows.length === 0" class="text-body-2 text-medium-emphasis py-8 text-center">
        {{ $t('admin.dashboard.no_data') }}
      </div>
      <v-table v-else>
        <thead>
          <tr>
            <th>{{ $t('admin.dashboard.col_display_name') }}</th>
            <th>{{ $t('admin.dashboard.col_email') }}</th>
            <th>{{ $t('admin.dashboard.col_department') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_session_count') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_total_amount') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_enterprise_subsidy') }}</th>
            <th class="text-right">{{ $t('admin.dashboard.col_user_paid') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.user_id">
            <td>{{ row.display_name }}</td>
            <td>{{ row.email }}</td>
            <td>{{ row.department || '—' }}</td>
            <td class="text-right">{{ row.session_count }}</td>
            <td class="text-right">{{ formatYen(row.total_amount) }}</td>
            <td class="text-right">{{ formatYen(row.enterprise_subsidy_amount) }}</td>
            <td class="text-right">{{ formatYen(row.user_paid_amount) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
