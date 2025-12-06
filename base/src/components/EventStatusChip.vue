<script setup lang="ts">
import { computed } from 'vue'
import { type EventStatusType } from '@shokujii/common/schemas/Event.js'

const props = defineProps<{
  status: EventStatusType
}>()

const chipColor = computed(() => {
  switch (props.status) {
    case 'in_draft':
      return 'info'
    case 'applying_reservation':
    case 'applying_to_admin':
      return 'warning'
    case 'accepting_order':
      return 'primary'
    case 'order_closed':
    case 'full':
      return 'error'
    case 'finished':
      return 'secondary'
    default: {
      const _exhaustiveCheck: never = props.status
      throw new Error(`Unsupported type: ${_exhaustiveCheck}`)
    }
  }
})
</script>

<template>
  <v-chip :color="chipColor">
    {{ $t(`event_status.${status}`) }}
  </v-chip>
</template>
