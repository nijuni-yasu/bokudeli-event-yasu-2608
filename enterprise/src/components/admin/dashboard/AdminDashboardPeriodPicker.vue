<script setup lang="ts">
import type { DashboardPeriod } from '@/utils/adminDashboardPeriod'
import { buildYearMonthOptions, formatYearMonthLabel } from '@/utils/adminDashboardPeriod'

const period = defineModel<DashboardPeriod>({ required: true })

const yearMonthOptions = buildYearMonthOptions()
</script>

<template>
  <v-row class="mb-4" align="center">
    <v-col cols="12" sm="4" md="3">
      <v-select
        v-model="period.start_year_month"
        :items="yearMonthOptions"
        :label="$t('admin.dashboard.period_start')"
        item-title="title"
        item-value="value"
        density="comfortable"
        hide-details
      />
    </v-col>
    <v-col cols="12" sm="4" md="3">
      <v-select
        v-model="period.end_year_month"
        :items="yearMonthOptions"
        :label="$t('admin.dashboard.period_end')"
        item-title="title"
        item-value="value"
        density="comfortable"
        hide-details
      />
    </v-col>
    <v-col cols="12" sm="4" md="6" class="text-body-2 text-medium-emphasis">
      {{ formatYearMonthLabel(period.start_year_month) }} 〜 {{ formatYearMonthLabel(period.end_year_month) }}
    </v-col>
  </v-row>
</template>
