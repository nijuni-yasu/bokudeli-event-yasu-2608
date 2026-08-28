<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiCartOutline, mdiMessageTextOutline } from '@mdi/js'
import { useConfigStore } from '@core/stores/config'
import { useSkins } from '@core/composable/useSkins'
import { AppContentLayoutNav, FooterType } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'
import { useLayoutConfigStore } from '@layouts/stores/config'
import { layoutConfig } from '@themeConfig'
import UserProfile from '@/components/UserProfile.vue'
import Footer from '@/components/Footer.vue'
import { useNavItems } from '@/navigation'
import type { Notification } from '@shokujii/base/types/index.js'
import { getChatPath, getLogin } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { getAuth, type User } from 'firebase/auth'
import { consumePendingToast } from '@/utils/pendingToast'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import TagImportHintHost from '@shokujii/base/components/TagImportHintHost.vue'

const router = useRouter()
const route = useRoute()
const { smAndDown } = useDisplay()
const layoutConfigStore = useLayoutConfigStore()
const chatStore = useChatStore()

/** チャット画面ではサイトフッターを隠し、ビューポートをチャット UI に専有する */
const isChatRoute = (path: string) => {
  const chatBase = getChatPath()
  const normalized = path.replace(/\/$/, '') || '/'
  return normalized === chatBase || normalized.startsWith(`${chatBase}/`)
}

watch(
  () => route.path,
  (path, oldPath) => {
    layoutConfigStore.footerType = isChatRoute(path) ? FooterType.Hidden : layoutConfig.footer.type
    if (oldPath != null && isChatRoute(oldPath) && !isChatRoute(path)) {
      chatStore.unsubscribeActiveRoom()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  layoutConfigStore.footerType = layoutConfig.footer.type
})

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('@/components/layouts/DefaultLayoutWithHorizontalNav.vue'),
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import('@/components/layouts/DefaultLayoutWithVerticalNav.vue'),
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
const chatUnreadCount = computed(() => chatStore.totalUnreadCount)
const chatBadgeContent = computed(() => {
  if (chatUnreadCount.value <= 0) return ''
  if (chatUnreadCount.value > 99) return '99+'
  return String(chatUnreadCount.value)
})

watch(
  currentUser,
  (user) => {
    if (user?.uid != null) {
      chatStore.subscribeMemberships(user.uid)
    } else {
      chatStore.unsubscribeAll()
    }
  },
  { immediate: true },
)

const handleChatHeaderClick = (): void => {
  if (isChatRoute(route.path)) {
    chatStore.requestOpenChatList()
    return
  }
  if (smAndDown.value) {
    void router.push({ path: getChatPath(), state: { openChatList: true } })
    return
  }
  void router.push(getChatPath())
}

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
        :model-value="chatUnreadCount > 0"
        :content="chatBadgeContent"
        color="primary"
        location="top end"
        offset-x="6"
        offset-y="6"
        class="me-3"
      >
        <v-btn
          variant="text"
          :aria-label="$t('chat.header_tooltip')"
          :icon="mdiMessageTextOutline"
          @click="handleChatHeaderClick"
        />
      </v-badge>
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
  <TagImportHintHost />
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use '@layouts/styles/default-layout';
</style>
