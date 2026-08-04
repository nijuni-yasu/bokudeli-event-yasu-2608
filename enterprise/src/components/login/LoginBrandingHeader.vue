<script setup lang="ts">
import { useEnterpriseLogoUrl } from '@/composable/useEnterpriseLogoUrl'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const { logoUrl, companyName } = useEnterpriseLogoUrl()

const companyNameClass = computed(() =>
  props.title != null ? 'text-h5 font-weight-bold' : 'text-h4 font-weight-bold',
)
</script>

<template>
  <v-card class="login-card rounded-lg pa-8 pa-sm-12 pa-md-15 w-100" elevation="4" max-width="480">
    <header class="login-branding-header__head pa-0">
      <v-row justify="center" class="mb-4">
        <v-img max-width="160" :src="logoUrl" :alt="companyName" />
      </v-row>
      <v-row v-if="companyName !== ''" justify="center" class="mb-3">
        <div class="text-center login-branding-header__company" :class="companyNameClass">
          {{ companyName }}
        </div>
      </v-row>
      <v-row v-if="title != null" justify="center" class="mb-0">
        <h1 class="text-h5 font-weight-medium text-center mb-0">{{ title }}</h1>
      </v-row>
      <v-row v-if="subtitle != null" justify="center" class="mt-3 mb-0">
        <p class="text-body-1 text-medium-emphasis text-center mb-0 login-branding-header__subtitle">
          {{ subtitle }}
        </p>
      </v-row>
    </header>
    <div class="login-branding-header__body" :class="{ 'login-branding-header__body--after-subtitle': subtitle != null }">
      <slot />
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.login-branding-header__subtitle {
  line-height: 1.6;
  text-wrap: pretty;
}

.login-branding-header__body {
  margin-top: 1.5rem;
}

.login-branding-header__body--after-subtitle {
  margin-top: 1.25rem;
}
</style>
