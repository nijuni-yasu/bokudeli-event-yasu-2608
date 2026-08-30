<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { useRoute, useRouter } from 'vue-router'
import {
  getEventEditPathByRawStatus,
  getEventEditShopNoticePath,
  getLogin,
  getManageCommunityPath,
} from '@/router/utils'
import { type BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import EventCartDialog from '@shokujii/base/components/EventCartDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import EventMenuList from '@shokujii/base/components/EventMenuList.vue'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useI18n } from 'vue-i18n'
import { mdiCogOutline, mdiEmail, mdiPencilOutline, mdiFoodForkDrink, mdiHome } from '@mdi/js'
import EventDetailsCard from '@shokujii/base/components/EventDetailsCard.vue'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import Banners from '@shokujii/base/components/Banners.vue'
import { useBannersStore } from '@shokujii/base/stores/banner.js'
import { useCommunityMemberFlags } from '@shokujii/base/composable/useCommunityMemberFlags'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getCommunityAlbumItemStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { useDisplay } from 'vuetify'
import { getChatPath } from '@/router/utils'
import { useNavigateToEventChat } from '@shokujii/base/composable/useNavigateToEventChat.js'
import { usePublicEventNotFoundRedirect } from '@shokujii/base/composable/usePublicEventNotFoundRedirect.js'

const route = useRoute()
const router = useRouter()
const communityAccount = route.params.communityAccount as string
const eventId = route.params.eventId as string

usePublicEventNotFoundRedirect(eventId, communityAccount)

const { t: $t } = useI18n()

const eventStore = useEventStore(eventId) as EventStore
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const bannersStore = useBannersStore('event_banners')
const currentUserStore = useCurrentUserStore()
const menuNavigation = ref(true)
const menuListRef = ref()
let menuListObserver: IntersectionObserver | null = null

// 共通の composable を使用してサポートアカウントのロール拡張を考慮（isManager のみ使用）
const { isManager } = useCommunityMemberFlags(communityAccount)

const event = computed<BokudeliEvent | null>(() => eventStore.event)

const canOpenChat = computed(() => {
  const uid = currentUserStore.firebaseUser?.uid
  const currentEvent = event.value
  if (uid == null || uid === '' || currentEvent == null) {
    return false
  }
  return currentEvent.members.includes(uid)
})

const { navigateToEventChat, isNavigatingToChat } = useNavigateToEventChat({
  getChatPath,
  userId: () => currentUserStore.firebaseUser?.uid,
})

const onOpenChat = (): void => {
  const currentEvent = event.value
  if (currentEvent == null) {
    return
  }
  void navigateToEventChat({ communityId: currentEvent.community_id, eventId: currentEvent.id })
}

/** 表示ステータスが下書き・予約申請中・注文受付中・満席のときイベント編集。それ以外はコミュニティ管理画面へ */
const showManagerEventEditButton = computed(
  () =>
    isManager.value &&
    event.value != null &&
    (event.value.calculatedEventStatus === 'in_draft' ||
      event.value.calculatedEventStatus === 'applying_reservation' ||
      event.value.calculatedEventStatus === 'accepting_order' ||
      event.value.calculatedEventStatus === 'full'),
)

const showManagerCommunityButton = computed(
  () => isManager.value && event.value != null && !showManagerEventEditButton.value,
)

const display = useDisplay()

const managerActionButtonSize = computed(() => (display.xs.value ? 'small' : 'default'))

const showApplyToShopButton = computed(
  () => event.value != null && event.value.event_status.value === 'in_draft' && isManager.value,
)

const hasManagerActions = computed(
  () => showApplyToShopButton.value || showManagerEventEditButton.value || showManagerCommunityButton.value,
)

const albumImageUrls = computed(() => {
  const cid = communityStore.community?.community_id
  if (cid == null) return []
  return (communityStore.albumItems ?? []).map((item) => ({
    id: item.id,
    url: convertStoragePathToURL(getCommunityAlbumItemStoragePath(cid, item.id)),
    caption: item.album_caption,
  }))
})

type MenuDisabledReason = 'finished' | 'order_closed' | 'not_accepting_order' | 'limit_people' | 'event_canceled'

const menuDisabled = computed<null | false | MenuDisabledReason>(() => {
  if (event.value == null) {
    return null
  }
  switch (event.value.calculatedEventStatus) {
    case 'finished':
      return 'finished'
    case 'event_canceled':
      return 'event_canceled'
    case 'order_closed':
      return 'order_closed'
    case 'full':
      return 'limit_people'
    case 'in_draft':
    case 'applying_reservation':
    case 'applying_to_admin':
      return 'not_accepting_order'
    case 'accepting_order':
      return false
    default:
      return null
  }
})

const selectedMenuState = reactive({
  menu: null as BokudeliEventMenu | null,
  isOpen: false,
})

const alertState = reactive({
  message: '',
  isOpen: false,
})

const isLoginRequired = ref(false)

const selectMenu = (menu: BokudeliEventMenu) => {
  const disabledReason = menuDisabled.value
  if (disabledReason == null) {
    return
  }

  // 注文不可の場合は理由を表示
  if (disabledReason !== false) {
    // 「イベント終了」の条件を優先
    if (disabledReason === 'finished') {
      alertState.message = $t('menu_disabled_reason.finished')
      alertState.isOpen = true
    } else {
      alertState.message = $t(`menu_disabled_reason.${disabledReason}`)
      alertState.isOpen = true
    }
    return
  }

  // ログインチェック
  if (currentUserStore.firebaseUser == null) {
    isLoginRequired.value = true
    return
  }

  selectedMenuState.menu = menu
  selectedMenuState.isOpen = true
}

const goToLogin = () => {
  router.push({
    path: getLogin(),
  })
}

const handleCartAdded = () => {
  router.push('/cart')
}

const scrollToMenu = () => {
  // Vuetify では scrollIntoView が使えないらしい
  // menuList.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const top = menuListRef.value?.$el?.offsetTop
  window.scrollTo({ top, behavior: 'smooth' })
}

// 下書き中の主催者向けモーダル表示
const draftNotice = ref(null as boolean | null)
const isDraftNotice = computed({
  get: () => {
    if (draftNotice.value === null) {
      if (event.value != null) {
        return isManager.value && event.value.event_status.value === 'in_draft'
      } else {
        return false
      }
    } else {
      return draftNotice.value
    }
  },
  set: (val) => {
    draftNotice.value = val
  },
})

// 予約申請中の主催者向けモーダル表示
const applyingNotice = ref(null as boolean | null)
const isApplyingNotice = computed({
  get: () => {
    if (applyingNotice.value === null) {
      if (event.value != null) {
        return isManager.value && event.value.event_status.value === 'applying_reservation'
      } else {
        return false
      }
    } else {
      return applyingNotice.value
    }
  },
  set: (val) => {
    applyingNotice.value = val
  },
})

// 参加者3人未満時の主催者向けモーダル表示
const fewMemberNotice = ref(null as boolean | null)
const isFewMemberNotice = computed({
  get: () => {
    if (fewMemberNotice.value === null) {
      if (event.value != null) {
        return (
          event.value.members.length < 1 &&
          event.value.is_public &&
          isManager.value &&
          event.value.event_status.value === 'accepting_order'
        )
      } else {
        return false
      }
    } else {
      return fewMemberNotice.value
    }
  },
  set: (val) => {
    fewMemberNotice.value = val
  },
})

watch(menuListRef, () => {
  const target = menuListRef.value?.$el
  if (target == null) {
    return
  }
  menuListObserver?.disconnect()
  menuListObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          menuNavigation.value = false
        } else {
          menuNavigation.value = true
        }
      })
    },
    {
      // オプションでroot、rootMargin、thresholdを設定可能
      threshold: 0,
    },
  )

  menuListObserver.observe(target)
})

onUnmounted(() => {
  menuListObserver?.disconnect()
  menuListObserver = null
})
</script>

<template>
  <div
    v-if="event != null && communityStore.community != null"
    class="event-page justify-center px-0 px-sm-0"
    :class="{ 'event-page--with-bottom-cta': event.event_status.value === 'accepting_order' }"
  >
    <v-row class="justify-center mt-lg-10">
      <v-col md="8" sm="9" cols="12" class="event-page-main py-0 py-sm-1 px-0 px-sm-0">
        <div class="event-page-toolbar mb-0">
          <v-btn
            class="event-page-toolbar__home"
            :icon="mdiHome"
            size="large"
            variant="text"
            to="/"
            :aria-label="$t('back_to_top')"
          />
          <div class="event-page-toolbar__status-chips">
            <EventStatusChip :status="event.calculatedEventStatus" size="large" />
            <v-chip v-if="!event.is_public" color="primary" size="large">
              {{ $t('private_event') }}
            </v-chip>
          </div>
          <div v-if="hasManagerActions" class="event-page-toolbar__actions">
            <v-btn
              v-if="showApplyToShopButton"
              class="event-page-toolbar__action-btn"
              variant="outlined"
              :size="managerActionButtonSize"
              :prepend-icon="mdiEmail"
              :to="getEventEditShopNoticePath(eventId)"
            >
              {{ $t('event_page.apply_to_shop') }}
            </v-btn>
            <v-btn
              v-if="showManagerEventEditButton"
              class="event-page-toolbar__action-btn"
              variant="outlined"
              :size="managerActionButtonSize"
              :prepend-icon="mdiPencilOutline"
              :to="getEventEditPathByRawStatus(eventId, event.event_status.value)"
            >
              {{ $t('event_page.edit') }}
            </v-btn>
            <v-btn
              v-if="showManagerCommunityButton"
              class="event-page-toolbar__action-btn"
              variant="outlined"
              :size="managerActionButtonSize"
              :prepend-icon="mdiCogOutline"
              :to="getManageCommunityPath(communityStore.community.community_account)"
            >
              {{ $t('user.community_management') }}
            </v-btn>
          </div>
        </div>
        <EventDetailsCard
          :event="event"
          :community="communityStore.community"
          :album-image-urls="albumImageUrls"
          :show-open-chat-button="canOpenChat"
          :open-chat-loading="isNavigatingToChat"
          @open-chat="onOpenChat"
        />
        <!-- メニュ -->
        <div class="event-page-menu">
          <event-menu-list
            ref="menuListRef"
            :event-id="eventId"
            :disabled="menuDisabled !== false"
            @select-menu="selectMenu"
          />
        </div>
      </v-col>
      <v-col md="6" sm="8" cols="11" class="event-page-banners ma-0 mt-md-16 px-0 px-sm-0">
        <Banners :banners="bannersStore.banners ?? []" />
      </v-col>
    </v-row>
  </div>
  <div v-else class="justify-center px-2 px-sm-0">
    <v-col cols="12" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </div>
  <event-cart-dialog
    v-if="selectedMenuState.menu && event != null"
    v-model="selectedMenuState.isOpen"
    :menu="selectedMenuState.menu"
    :event-id="event.event_id"
    @added="handleCartAdded"
  ></event-cart-dialog>
  <confirm-dialog v-model="isLoginRequired" :is-confirm="true" :ok-click="goToLogin" max-width="700px">
    <v-card-text class="pb-0" style="line-height: 2rem; white-space: pre-line">
      {{ $t('cart_dialog.login') }}
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="alertState.isOpen" :is-confirm="false">{{ alertState.message }}</confirm-dialog>
  <confirm-dialog v-model="isDraftNotice" :ok-text="'OK'" max-width="700px">
    <v-card-text class="text-center py-10 text-h4">
      <div v-html="$t('event_draft_notice_modal.title')"></div>
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2rem">
      <div v-html="$t('event_draft_notice_modal.desc')"></div>
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isApplyingNotice" :ok-text="'OK'" max-width="700px">
    <v-card-text class="text-center py-10 text-h4">
      <div v-html="$t('event_applying_notice_modal.title')"></div>
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2rem">
      <div v-html="$t('event_applying_notice_modal.desc')"></div>
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isFewMemberNotice" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-10 text-h4">
      <div v-html="$t('event_few_members_notice_modal.title')"></div>
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2rem">
      <div v-html="$t('event_few_members_notice_modal.desc')"></div>
    </v-card-text>
  </confirm-dialog>
  <v-navigation-drawer
    v-if="event?.event_status.value === `accepting_order`"
    v-model="menuNavigation"
    location="bottom"
    permanent
    touchless
    border="0"
    color="#FFFFFF00"
    class="event-page-bottom-cta"
  >
    <v-row class="justify-center mb-2">
      <v-col xl="6" lg="8" md="8" sm="9" cols="12">
        <v-btn
          class="event-page-bottom-cta__btn text-md-h4 text-body-1 font-weight-bold"
          size="large"
          rounded="pill"
          elevation="10"
          color="primary"
          width="85%"
          @click="scrollToMenu"
        >
          <v-icon :icon="mdiFoodForkDrink" class="mr-2" />
          {{ $t('event_page.order_and_join') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-navigation-drawer>
</template>

<style scoped lang="scss">
.event-page--with-bottom-cta {
  padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
}

@media (max-width: 599px) {
  .event-page-main.v-col,
  .event-page-banners.v-col {
    padding-inline: 14px !important;
  }
}

.event-page-menu {
  margin-top: 24px;
  margin-bottom: 32px;

  @media (min-width: 600px) {
    margin-top: 32px;
    margin-bottom: 40px;
  }
}

.event-page-banners {
  margin-bottom: 24px;

  @media (min-width: 960px) {
    margin-bottom: 32px;
  }
}

.event-page-bottom-cta {
  z-index: 100;
  text-align: center;
  height: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.event-page-bottom-cta__btn {
  @media (max-width: 599px) {
    font-size: 0.9375rem !important;
    letter-spacing: 0;
  }
}

.event-page-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.event-page-toolbar__home {
  flex-shrink: 0;
}

.event-page-toolbar__status-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-inline-start: auto;
}

.event-page-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.event-page-toolbar__action-btn {
  white-space: nowrap;
}

@media (max-width: 599px) {
  .event-page-toolbar__status-chips :deep(.v-chip) {
    font-size: 0.8125rem;
  }
}
</style>
