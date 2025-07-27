<script setup lang="ts">
import { computed } from 'vue'
import { type LetterStatusType } from '@shokujii/base/schemes/letter'

const props = defineProps<{
  status: LetterStatusType
}>()

const chipColor = computed(() => {
  switch (props.status) {
    case 'draft':
      return 'info'
    case 'timed':
      return 'primary'
    case 'sent':
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
    {{ $t(`letter_status.${status}`) }}
  </v-chip>
</template>
