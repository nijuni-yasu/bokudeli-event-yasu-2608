<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiCartOutline } from '@mdi/js'
import { useConfigStore } from '@core/stores/config'
import { useSkins } from '@core/composable/useSkins'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'
import UserProfile from '@/components/UserProfile.vue'
import Footer from '@/components/Footer.vue'
import { useNavItems } from '@/navigation'
import type { Notification } from '@shokujii/base/types/index.js'
import { getLogin } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getAuth, type User } from 'firebase/auth'
import { consumePendingToast } from '@/utils/pendingToast'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithHorizontalNav.vue'),
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import('@shokujii/base/components/layouts/DefaultLayoutWithVerticalNav.vue'),
)

const navItems = useNavItems()

const configStore = useConfigStore()
configStore.appContentLayoutNav = AppContentLayoutNav.Horizontal
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

const isNotificationShown = computed({
  get: () => notification.message !== undefined,
  set: (value: boolean) => {
    if (!value) {
      notification.message = undefined
      notification.color = undefined
    }
  },
})
const currentUser = ref<User | null>(null)
getAuth().onAuthStateChanged((user) => {
  currentUser.value = user
})

const { cart } = storeToRefs(useCurrentUserStore())
const cartMenuCount = computed(() => cart.value?.reduce((sum, item) => sum + item.orders.length, 0) ?? 0)
const cartBadgeContent = computed(() => (cartMenuCount.value > 0 ? String(cartMenuCount.value) : ''))

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
      <v-btn v-if="currentUser == null" class="me-4" variant="outlined" :to="getLogin()">
        {{ $t('navigation.login') }}
      </v-btn>
      <v-badge
        v-if="currentUser != null"
        :model-value="cartMenuCount > 0"
        :content="cartBadgeContent"
        color="primary"
        location="top end"
        offset-x="6"
        offset-y="6"
        class="me-3"
      >
        <v-btn variant="text" to="/cart" :aria-label="$t('user_profile.cart')" :icon="mdiCartOutline" />
      </v-badge>
      <UserProfile />
    </template>
    <template #footer>
      <Footer />
    </template>
  </Component>
  <v-snackbar v-model="isNotificationShown" :color="notification.color" class="pre-line" location="top">
    {{ notification.message }}
  </v-snackbar>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use '@layouts/styles/default-layout';
</style>
