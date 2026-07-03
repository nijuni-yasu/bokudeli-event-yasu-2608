<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  effectiveDate?: string
  revisedDates?: string[]
}>()

const hasDates = computed(
  () => props.effectiveDate != null || (props.revisedDates != null && props.revisedDates.length > 0),
)

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (year == null || month == null || day == null) {
    return isoDate
  }
  return `${year}年${Number(month)}月${Number(day)}日`
}
</script>

<template>
  <div v-if="hasDates" class="legal-dates">
    <p v-if="effectiveDate != null" class="legal-dates__line">
      <strong>制定日</strong>：{{ formatDate(effectiveDate) }}
    </p>
    <template v-if="revisedDates != null && revisedDates.length > 0">
      <p class="legal-dates__line"><strong>改定日</strong></p>
      <ul class="legal-dates__list">
        <li v-for="date in revisedDates" :key="date">{{ formatDate(date) }}</li>
      </ul>
    </template>
  </div>
</template>
