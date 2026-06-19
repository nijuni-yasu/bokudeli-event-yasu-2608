<script setup lang="ts">
import { useTheme } from 'vuetify'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'
import { useNotification } from '@shokujii/base/composable/notification'

const { global } = useTheme()
const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()

watch(
  () => route.query.enterprise_blocked,
  (value) => {
    if (value === '1') {
      notification.show($t('auth.enterprise_user_on_pf'), 'warning')
      const query = { ...route.query }
      delete query.enterprise_blocked
      void router.replace({ path: route.path, query })
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-locale-provider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <v-app :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <router-view />
    </v-app>
  </v-locale-provider>
</template>
