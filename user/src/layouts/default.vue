<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { mdiCartOutline, mdiMessageTextOutline, mdiPartyPopper } from '@mdi/js'
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
import { getManagePath, getManageNewCommunityPath, getLogin } from '@/router/utils'
import { hasManagedCommunity } from '@shokujii/base/stores/community.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { consumePendingToast } from '@shokujii/base/utils/pendingToast.js'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { getAuth, type User } from 'firebase/auth'

const router = useRouter()
const route = useRoute()
const { smAndDown } = useDisplay()
const layoutConfigStore = useLayoutConfigStore()
const chatStore = useChatStore()

/** チャット画面ではサイトフッターを隠し、ビューポートをチャット UI に専有する */
const isChatRoute = (path: string) => {
  const normalized = path.replace(/\/$/, '') || '/'
  return normalized === '/chat' || normalized.startsWith('/chat/')
}

/** イベント詳細ページ（メイン）ではフッターを控えめ表示 */
const isEventPageRoute = (path: string) => {
  const normalized = path.replace(/\/$/, '') || '/'
  return /^\/c\/[^/]+\/e\/[^/]+$/.test(normalized)
}

const isFooterCompact = computed(() => isEventPageRoute(route.path))

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
const currentUser = ref<User | null>(null)
getAuth().onAuthStateChanged((user) => {
  currentUser.value = user
})

const handleEventHostClick = async () => {
  const uid = currentUser.value?.uid
  if (uid == null) return

  const hasCommunity = await hasManagedCommunity(uid)
  router.push(hasCommunity ? getManagePath() : getManageNewCommunityPath())
}

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
    void router.push({ path: '/chat', state: { openChatList: true } })
    return
  }
  void router.push('/chat')
}
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
      <v-btn
        v-if="currentUser != null"
        class="event-host-cta me-4"
        :append-icon="mdiPartyPopper"
        @click="handleEventHostClick"
      >
        {{ $t('navigation.new_event') }}
      </v-btn>
      <v-btn v-else class="me-4" variant="outlined" :to="getLogin()">
        {{ $t('navigation.login') }}
      </v-btn>
      <v-badge
        v-if="currentUser != null"
        :model-value="chatUnreadCount > 0"
        :content="chatBadgeContent"
        color="success"
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
      <Footer :compact="isFooterCompact" />
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

<style lang="scss" scoped>
// イベント開催ボタン: ナビの「イベント参加」「コミュニティ」と同じグラデーション + キラーンアニメーション
.event-host-cta {
  background: linear-gradient(
    -72.47deg,
    rgb(var(--v-global-theme-primary)) 22.16%,
    rgba(var(--v-global-theme-primary), 0.7) 76.47%
  ) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    width: 50%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    animation: event-host-shimmer 5.5s ease-in-out infinite;
  }

  :deep(.v-btn__content),
  :deep(.v-icon) {
    position: relative;
    z-index: 1;
  }

  :deep(.v-icon) {
    color: rgb(var(--v-theme-on-primary)) !important;
  }
}

@keyframes event-host-shimmer {
  0% {
    transform: translateX(-100%);
  }
  18% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(200%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-host-cta::before {
    animation: none;
    display: none;
  }
}
</style>
