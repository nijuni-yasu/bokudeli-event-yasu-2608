<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { useConfigStore } from '@core/stores/config'
import { useSkins } from '@core/composable/useSkins'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'
import UserProfile from '@/components/UserProfile.vue'
import Footer from '@/components/Footer.vue'
import EnterpriseModeSwitchButtons from '@/components/EnterpriseModeSwitchButtons.vue'
import { useAdminNavItems } from '@/navigation/admin'
import type { Notification } from '@shokujii/base/types/index.js'
import { consumePendingToast } from '@/utils/pendingToast'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithHorizontalNav.vue'),
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithVerticalNav.vue'),
)

const navItems = useAdminNavItems()

const configStore = useConfigStore()
configStore.appContentLayoutNav = AppContentLayoutNav.Vertical

switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()
injectSkinClasses()

const notification = reactive<Notification>({
  message: undefined,
  color: undefined,
})
provide('notification', notification)

const isNotificationShown = computed({
  get: () => notification.message !== undefined,
  set: (value: boolean) => {
    if (!value) {
      notification.message = undefined
      notification.color = undefined
    }
  },
})

onMounted(() => {
  const toast = consumePendingToast()
  if (toast != null) {
    Object.assign(notification, toast)
  }
})
</script>

<template>
  <Component
    v-bind="layoutAttrs"
    :nav-items="navItems"
    :is="
      configStore.appContentLayoutNav === AppContentLayoutNav.Vertical
        ? DefaultLayoutWithVerticalNav
        : DefaultLayoutWithHorizontalNav
    "
  >
    <template #navbar-icons>
      <EnterpriseModeSwitchButtons mode="admin" />
      <UserProfile />
    </template>
    <template #footer>
      <Footer />
    </template>
  </Component>
  <v-snackbar v-model="isNotificationShown" :color="notification.color" location="top">
    {{ notification.message }}
  </v-snackbar>
</template>

<style lang="scss">
@use '@layouts/styles/default-layout';
@use '@/styles/adminTable';
</style>
