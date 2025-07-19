<script setup lang="ts">
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
const isOpenDialog = defineModel<boolean>({ required: true })
</script>

<template>
  <confirm-dialog v-model="isOpenDialog" :is-confirm="false">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('cancelpolicy_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2rem">
      <div v-html="$t('cancelpolicy_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
</template>
