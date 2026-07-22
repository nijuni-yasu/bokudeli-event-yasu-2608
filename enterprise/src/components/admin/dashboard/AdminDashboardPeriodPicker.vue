<script setup lang="ts">
import type { DashboardPeriod } from '@/utils/adminDashboardPeriod'
import {
  buildYearMonthOptions,
  clampEndYearMonth,
  clampStartYearMonth,
  filterEndYearMonthOptions,
  filterStartYearMonthOptions,
  formatYearMonthLabel,
} from '@/utils/adminDashboardPeriod'

const period = defineModel<DashboardPeriod>({ required: true })

const allYearMonthOptions = buildYearMonthOptions()

const startYearMonthOptions = computed(() =>
  filterStartYearMonthOptions(allYearMonthOptions, period.value.end_year_month),
)

const endYearMonthOptions = computed(() =>
  filterEndYearMonthOptions(allYearMonthOptions, period.value.start_year_month),
)

watch(
  () => period.value.end_year_month,
  (endYearMonth) => {
    const clampedStart = clampStartYearMonth(period.value.start_year_month, endYearMonth)
    if (clampedStart !== period.value.start_year_month) {
      period.value.start_year_month = clampedStart
    }
  },
)

watch(
  () => period.value.start_year_month,
  (startYearMonth) => {
    const clampedEnd = clampEndYearMonth(startYearMonth, period.value.end_year_month)
    if (clampedEnd !== period.value.end_year_month) {
      period.value.end_year_month = clampedEnd
    }
  },
)
</script>

<template>
  <v-row class="mb-4" align="center">
    <v-col cols="12" sm="4" md="3">
      <v-select
        v-model="period.start_year_month"
        :items="startYearMonthOptions"
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
        :items="endYearMonthOptions"
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
