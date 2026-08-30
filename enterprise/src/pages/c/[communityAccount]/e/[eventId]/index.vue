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
import { useEventStore, buildEventStoreOptions, type EventStore } from '@shokujii/base/stores/event.js'
import {
  useEnterpriseCommunityMemberFlags,
  useEnterpriseCommunityStore,
} from '@/composable/useEnterpriseCommunityStore'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useI18n } from 'vue-i18n'
import { mdiEmail, mdiPencilOutline, mdiFoodForkDrink, mdiHome } from '@mdi/js'
import EventDetailsCard from '@shokujii/base/components/EventDetailsCard.vue'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getCommunityAlbumItemStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { useEnterpriseId } from '@/composable/useEnterpriseId'
import { useEnterpriseTenantGuard } from '@/composable/useEnterpriseTenantGuard'
import EnterpriseErrorPage from '@/components/EnterpriseErrorPage.vue'
import { getChatPath } from '@/router/utils'
import { useNavigateToEventChat } from '@shokujii/base/composable/useNavigateToEventChat.js'
import { usePublicEventNotFoundRedirect } from '@shokujii/base/composable/usePublicEventNotFoundRedirect.js'

const route = useRoute()
const router = useRouter()
const communityAccount = route.params.communityAccount as string
const eventId = route.params.eventId as string

const { t: $t } = useI18n()
const { enterpriseId } = useEnterpriseId()
if (enterpriseId.value == null) {
  throw new Error('Enterprise is not resolved')
}

usePublicEventNotFoundRedirect(eventId, communityAccount, buildEventStoreOptions(enterpriseId.value))

const eventStore = useEventStore(eventId, buildEventStoreOptions(enterpriseId.value)) as EventStore
const communityStore = useEnterpriseCommunityStore(communityAccount)
const eventEnterpriseId = computed(() => eventStore.event?.enterprise_id)
const communityEnterpriseId = computed(() => communityStore.community?.enterprise_id)
const { isTenantMismatch } = useEnterpriseTenantGuard([eventEnterpriseId, communityEnterpriseId])
const isCommunityAccountMismatch = computed(() => {
  const loadedEvent = eventStore.event
  return loadedEvent != null && loadedEvent.community_account !== communityAccount
})
const isAccessDenied = computed(() => isTenantMismatch.value || isCommunityAccountMismatch.value)
const currentUserStore = useCurrentUserStore()
const menuNavigation = ref(true)
const menuListRef = ref()
let menuListObserver: IntersectionObserver | null = null

// 共通の composable を使用してサポートアカウントのロール拡張を考慮（isManager のみ使用）
const { isManager } = useEnterpriseCommunityMemberFlags(communityAccount)

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
  <EnterpriseErrorPage v-if="isAccessDenied" variant="not_found" />
  <div v-else-if="event != null && communityStore.community != null" class="justify-center px-0 px-sm-0">
    <v-row class="justify-center mt-lg-10">
      <v-col md="8" sm="9" cols="12" class="py-0 py-sm-1">
        <v-row class="justify-space-between align-center my-0 py-0" style="gap: 15px">
          <v-btn :icon="mdiHome" size="x-large" variant="text" to="/" />
          <v-spacer />
          <EventStatusChip :status="event.calculatedEventStatus" size="large" />
          <v-chip v-if="!event.is_public" color="primary" size="large">
            {{ $t('private_event') }}
          </v-chip>
          <v-btn
            v-if="event.event_status.value === `in_draft` && isManager"
            class="ml-2 my-1"
            variant="outlined"
            :prepend-icon="mdiEmail"
            :to="getEventEditShopNoticePath(eventId)"
          >
            {{ $t('event_page.apply_to_shop') }}
          </v-btn>
          <v-btn
            v-if="showManagerEventEditButton"
            class="ml-2 my-1"
            variant="outlined"
            :prepend-icon="mdiPencilOutline"
            :to="getEventEditPathByRawStatus(eventId, event.event_status.value)"
          >
            {{ $t('event_page.edit') }}
          </v-btn>
          <v-btn
            v-if="showManagerCommunityButton"
            class="ml-2 my-1"
            variant="outlined"
            :to="getManageCommunityPath(communityStore.community.community_account)"
          >
            {{ $t('user.community_management') }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col md="8" sm="9" cols="12" class="mt-0 pt-0 px-0">
        <EventDetailsCard
          :event="event"
          :community="communityStore.community"
          :album-image-urls="albumImageUrls"
          hide-share-sns
          :show-open-chat-button="canOpenChat"
          :open-chat-loading="isNavigatingToChat"
          @open-chat="onOpenChat"
        />
        <!-- メニュ -->
        <event-menu-list
          ref="menuListRef"
          :event-id="eventId"
          :disabled="menuDisabled !== false"
          @select-menu="selectMenu"
        />
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
    style="height: 70px; z-index: 100; text-align: center"
  >
    <v-row class="justify-center mb-2">
      <v-col xl="6" lg="8" md="8" sm="9" cols="12">
        <v-btn
          class="text-md-h4 text-h5 font-weight-bold"
          size="large"
          rounded="pill"
          elevation="15"
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
