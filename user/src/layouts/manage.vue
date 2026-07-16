<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { useConfigStore } from '@core/stores/config'
import { useSkins } from '@core/composable/useSkins'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'
import UserProfile from '@/components/UserProfile.vue'
import Footer from '@/components/Footer.vue'
import { useNavItems } from '@/navigation/manage'
import type { Notification } from '@shokujii/base/types/index.js'
import { consumePendingToast } from '@shokujii/base/utils/pendingToast.js'
import { useLayoutConfigStore } from '@layouts/stores/config'
import { FooterType } from '@layouts/enums'
import { layoutConfig } from '@themeConfig'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithHorizontalNav.vue'),
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithVerticalNav.vue'),
)

const navItems = useNavItems()

const configStore = useConfigStore()
configStore.appContentLayoutNav = AppContentLayoutNav.Vertical

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

const notification = reactive<Notification>({
  message: undefined,
  color: undefined,
})
provide('notification', notification)

onMounted(() => {
  const toast = consumePendingToast()
  if (toast != null) {
    notification.message = toast.message
    notification.color = toast.color
  }
})

const isNotificationShown = computed({
  get: () => notification.message !== undefined,
  set: (value: boolean) => {
    if (!value) {
      notification.message = undefined
      notification.color = undefined
    }
  },
})

const route = useRoute()
const layoutConfigStore = useLayoutConfigStore()

/** イベント編集（新規・設定タブ）ではサイトフッターを隠し、固定ステップナビと重ならないようにする */
const isEventEditFooterHidden = (path: string) => {
  const normalized = path.replace(/\/$/, '') || '/'
  return (
    /\/manage\/community\/[^/]+\/newevent$/.test(normalized) || /\/manage\/event\/[^/]+\/settings$/.test(normalized)
  )
}

watch(
  () => route.path,
  (path) => {
    layoutConfigStore.footerType = isEventEditFooterHidden(path) ? FooterType.Hidden : layoutConfig.footer.type
  },
  { immediate: true },
)

onUnmounted(() => {
  layoutConfigStore.footerType = layoutConfig.footer.type
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
      <v-btn class="me-4" to="/"> {{ $t('navigation.home') }}</v-btn>
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
// As we are using `layouts` plugin we need its styles to be imported
@use '@layouts/styles/default-layout';
</style>
