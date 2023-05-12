<script setup lang="ts">
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'

const { global } = useTheme()
</script>

<template>
  <v-locale-provider>
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <v-app :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <router-view />
    </v-app>
  </v-locale-provider>
</template>
