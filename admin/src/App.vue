<script setup lang="ts">
import { useTheme } from 'vuetify'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()
</script>

<template>
  <v-locale-provider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <v-app :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <router-view />
    </v-app>
  </v-locale-provider>
</template>
