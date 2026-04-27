<script setup lang="ts">
import type { CommunityBillSettingsType } from '@shokujii/common/schemas/Event.js'

defineProps<{
  settings: CommunityBillSettingsType
}>()
</script>

<template>
  <v-chip color="discount">
    {{
      settings.type === 'free'
        ? $t('discount_settings.chip_free')
        : $t('discount_settings.chip_discount', [settings.off_amount])
    }}
  </v-chip>
</template>
