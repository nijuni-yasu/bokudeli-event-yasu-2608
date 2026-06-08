<script setup lang="ts">
import { mdiFilePdfBox } from '@mdi/js'

defineProps<{
  show: boolean
  invoicePath: string
}>()
</script>

<template>
  <v-row v-if="show" class="justify-center mb-2">
    <v-col md="12" sm="12" cols="12">
      <v-alert variant="tonal" color="primary" :icon="mdiFilePdfBox" density="comfortable">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          {{ $t('manage.event.community_bill_notice.title') }}
        </div>
        <div class="text-body-2" v-html="$t('manage.event.community_bill_notice.description')" />
        <div class="d-flex align-center flex-wrap mt-3">
          <span class="text-body-2 me-2">{{ $t('manage.event.community_bill_notice.link_label') }}</span>
          <v-btn variant="outlined" size="small" color="primary" :prepend-icon="mdiFilePdfBox" :to="invoicePath">
            {{ $t('manage.event.community_bill_notice.link_button') }}
          </v-btn>
        </div>
      </v-alert>
    </v-col>
  </v-row>
</template>
