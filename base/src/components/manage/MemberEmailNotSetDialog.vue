<script setup lang="ts">
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

const model = defineModel<boolean>({ required: true })

defineProps<{
  okClick: () => void
}>()
</script>

<template>
  <ConfirmDialog v-model="model" :ok-text="'OK'" max-width="700px" :ok-click="okClick">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('manage.letter.email_not_set.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('manage.letter.email_not_set.description')" />
    </v-card-text>
  </ConfirmDialog>
</template>
