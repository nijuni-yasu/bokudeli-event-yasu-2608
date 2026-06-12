<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  variant: 'not_found' | 'error'
}>()

const { t } = useI18n()
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-6 text-center">
          <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
          <h1 class="text-h5 mb-4">
            {{ variant === 'not_found' ? t('enterprise.error.not_found_title') : t('enterprise.error.generic_title') }}
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            {{ variant === 'not_found' ? t('enterprise.error.not_found_body') : t('enterprise.error.generic_body') }}
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
