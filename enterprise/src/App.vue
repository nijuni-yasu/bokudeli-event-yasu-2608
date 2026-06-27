<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useTheme } from 'vuetify'
import { useSessionTimeout } from '@/composable/useSessionTimeout'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'
import { storeToRefs } from 'pinia'
import { useEnterpriseStore } from '@/stores/enterprise'
import { darken } from '@/utils/color'
import EnterpriseErrorPage from '@/components/EnterpriseErrorPage.vue'

const theme = useTheme()
const { global } = theme

initCore()
initConfigStore()

const configStore = useConfigStore()
const enterpriseStore = useEnterpriseStore()
const { status, enterprise } = storeToRefs(enterpriseStore)

function applyEnterpriseTheme(themeColor: string) {
  for (const name of ['light', 'dark'] as const) {
    theme.themes.value[name].colors.primary = themeColor
    theme.themes.value[name].colors['primary-darken-1'] = darken(themeColor, 0.2)
  }
}

watch(
  enterprise,
  (value) => {
    if (value?.theme_color != null) {
      applyEnterpriseTheme(value.theme_color)
    }
  },
  { immediate: true },
)

const sessionTimeout = useSessionTimeout()

onMounted(() => {
  onAuthStateChanged(getAuth(), (user) => {
    if (user != null) {
      sessionTimeout.start()
    } else {
      sessionTimeout.stop()
    }
  })
})
</script>

<template>
  <v-locale-provider :rtl="configStore.isAppRTL">
    <v-app :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <div v-if="status === 'loading'" id="loading-bg">
        <div class="loading">
          <div class="effect-1 effects" />
          <div class="effect-2 effects" />
          <div class="effect-3 effects" />
        </div>
      </div>
      <EnterpriseErrorPage v-else-if="status === 'not_found'" variant="not_found" />
      <EnterpriseErrorPage v-else-if="status === 'error'" variant="error" />
      <router-view v-else />
    </v-app>
  </v-locale-provider>
</template>
