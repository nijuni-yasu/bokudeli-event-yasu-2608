<script setup lang="ts">
import { useEnterpriseLogoUrl } from '@/composable/useEnterpriseLogoUrl'

defineProps<{
  title?: string
  subtitle?: string
}>()

const { logoUrl, companyName } = useEnterpriseLogoUrl()
</script>

<template>
  <v-card class="login-card rounded-lg pa-8 pa-sm-12 pa-md-15 w-100" elevation="4" max-width="480">
    <v-container class="mb-2 pa-0">
      <v-row justify="center">
        <v-img max-width="160" :src="logoUrl" :alt="companyName" />
      </v-row>
      <v-row v-if="companyName !== ''" justify="center">
        <div class="my-3 text-h4 font-weight-bold text-center">
          {{ companyName }}
        </div>
      </v-row>
      <v-row v-if="title != null" justify="center">
        <h1 class="text-h5 font-weight-medium text-center">{{ title }}</h1>
      </v-row>
      <v-row v-if="subtitle != null" justify="center">
        <p class="text-center mb-0">{{ subtitle }}</p>
      </v-row>
    </v-container>
    <slot />
  </v-card>
</template>
