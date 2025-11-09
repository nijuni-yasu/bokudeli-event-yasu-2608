<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, watchEffect } from 'vue'
import { getEventEditBasicPath, getEventEditDetailsPath, getEventEditShopNoticePath } from '@/router/utils'
import { type BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import EventCartDialog from '@shokujii/base/components/EventCartDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import EventMenuList from '@shokujii/base/components/EventMenuList.vue'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useI18n } from 'vue-i18n'
import { mdiPencilBoxOutline, mdiFoodForkDrink, mdiHome } from '@mdi/js'
import EventDetailsCard from '@shokujii/base/components/EventDetailsCard.vue'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import Banners from '@shokujii/base/components/Banners.vue'
import { useBannersStore } from '@shokujii/base/stores/banner.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import LoginDialog from '@shokujii/base/components/LoginDialog.vue'

const communityId = useRoute().params.communityId as string
const eventId = useRoute().params.eventId as string

const { t: $t } = useI18n()

const eventStore = useEventStore(eventId) as EventStore
const communityStore = useCommunityStore(communityId) as CommunityStore
const bannersStore = useBannersStore('event_banners')
const menuNavigation = ref(true)
const menuListRef = ref()
let menuListObserver: IntersectionObserver | null = null

const userStore = useCurrentUserStore()
const currentUserId = computed(() => userStore.firebaseUser?.uid ?? null)

const isManager = ref(false)
const isCommunityMember = ref(false)
const isCommunityManager = ref(false)

// リアルタイムにコミュニティのメンバー情報を更新
watchEffect(() => {
  const uid = currentUserId.value
  const community = communityStore.community
  if (uid == null || community == null) {
    isCommunityMember.value = false
    isCommunityManager.value = false
    isManager.value = false
    return
  }
  const member = community.members?.some((memberRef) => memberRef.id === uid) ?? false
  const manager = community.managers?.some((managerRef) => managerRef.id === uid) ?? false
  isCommunityMember.value = member
  isCommunityManager.value = manager
  isManager.value = manager
})

const event = computed<BokudeliEvent | null>(() => eventStore.event)

type MenuDisabledReason = 'finished' | 'order_closed' | 'not_accepting_order' | 'limit_people'

const menuDisabled = computed<null | false | MenuDisabledReason>(() => {
  if (event.value == null) {
    return null
  }
  switch (event.value.calculatedEventStatus) {
    case 'finished':
      return 'finished'
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

const membershipState = reactive({
  loading: false,
  snackbarVisible: false,
  snackbarMessage: '',
  snackbarColor: 'success' as 'success' | 'error',
})

const isOpenLoginDialog = ref(false)

const showMembershipMessage = (message: string, color: 'success' | 'error' = 'success') => {
  membershipState.snackbarMessage = message
  membershipState.snackbarColor = color
  membershipState.snackbarVisible = true
}

const joinCommunity = async () => {
  if (userStore.firebaseUser == null) {
    showMembershipMessage($t('community_membership.login_required'), 'error')
    isOpenLoginDialog.value = true
    return
  }
  if (membershipState.loading) return
  membershipState.loading = true
  try {
    await communityStore.joinCommunity()
    isCommunityMember.value = true
    showMembershipMessage($t('community_membership.join_success'), 'success')
  } catch (error) {
    const message = (error as Error)?.message
    if (message === 'not-logged-in') {
      showMembershipMessage($t('community_membership.login_required'), 'error')
      isOpenLoginDialog.value = true
    } else {
      console.error(error)
      showMembershipMessage($t('community_membership.error_generic'), 'error')
    }
  } finally {
    membershipState.loading = false
  }
}

const leaveCommunity = async () => {
  if (userStore.firebaseUser == null) {
    showMembershipMessage($t('community_membership.login_required'), 'error')
    isOpenLoginDialog.value = true
    return
  }
  if (isCommunityManager.value) {
    showMembershipMessage($t('community_membership.manager_leave_forbidden'), 'error')
    return
  }
  if (membershipState.loading) return
  membershipState.loading = true
  try {
    await communityStore.leaveCommunity()
    isCommunityMember.value = false
    showMembershipMessage($t('community_membership.leave_success'), 'success')
  } catch (error) {
    const message = (error as Error)?.message
    if (message === 'manager-cannot-leave') {
      showMembershipMessage($t('community_membership.manager_leave_forbidden'), 'error')
    } else if (message === 'not-logged-in') {
      showMembershipMessage($t('community_membership.login_required'), 'error')
      isOpenLoginDialog.value = true
    } else {
      console.error(error)
      showMembershipMessage($t('community_membership.error_generic'), 'error')
    }
  } finally {
    membershipState.loading = false
  }
}

const selectMenu = (menu: BokudeliEventMenu) => {
  const disabledReason = menuDisabled.value
  if (disabledReason == null) {
    return
  }
  if (menuDisabled.value === 'finished') {
    alertState.message = $t('menu_disabled_reason.finished')
    alertState.isOpen = true
  } else if (disabledReason === false) {
    selectedMenuState.menu = menu
    selectedMenuState.isOpen = true
  } else {
    alertState.message = $t(`menu_disabled_reason.${disabledReason}`)
    alertState.isOpen = true
  }
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
  <div v-if="event != null && communityStore.community != null" class="justify-center">
    <v-row class="justify-center mt-lg-10">
      <v-col md="8" sm="9" cols="12">
        <v-row class="justify-space-between align-center my-0 py-0" style="gap: 15px">
          <v-btn :icon="mdiHome" size="x-large" variant="text" to="/" />
          <v-spacer />
          <EventStatusChip :status="event.calculatedEventStatus" size="large" />
          <v-chip v-if="!event.is_public" color="primary" size="large">
            {{ $t('private_event') }}
          </v-chip>
          <v-btn
            v-if="event.event_status.value === `in_draft` && isManager"
            color="white"
            class="ml-2 my-1"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiEmail"
            :to="getEventEditShopNoticePath(eventId)"
          >
            店舗へ予約申請
          </v-btn>
          <v-btn
            v-if="
              (event.calculatedEventStatus === 'in_draft' ||
                event.calculatedEventStatus === 'full' ||
                event.calculatedEventStatus === 'applying_reservation' ||
                event.calculatedEventStatus === 'accepting_order') &&
              isManager
            "
            color="white"
            class="ml-2 my-1"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiPencilBoxOutline"
            :to="
              event.event_status.value === 'in_draft'
                ? getEventEditBasicPath(eventId)
                : getEventEditDetailsPath(eventId)
            "
          >
            イベント編集
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col md="8" sm="9" cols="12" class="mt-0 pt-0 px-0">
        <EventDetailsCard
          :event="event"
          :community="communityStore.community"
          :is-member="isCommunityMember"
          :is-manager="isCommunityManager"
          :membership-loading="membershipState.loading"
          @click-join="joinCommunity"
          @click-leave="leaveCommunity"
        />
        <!-- メニュ -->
        <event-menu-list
          ref="menuListRef"
          :menus="eventStore.menus"
          :disabled="menuDisabled !== false"
          @select-menu="selectMenu"
        />
      </v-col>
      <v-col md="6" sm="8" cols="11" class="ma-0 mt-md-16">
        <Banners :banners="bannersStore.banners ?? []" />
      </v-col>
    </v-row>
  </div>
  <div v-else class="justify-center">
    <v-col cols="12" class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </div>
  <event-cart-dialog
    v-if="selectedMenuState.menu && event != null"
    v-model="selectedMenuState.isOpen"
    :menu="selectedMenuState.menu"
    :event-id="event.event_id"
  ></event-cart-dialog>
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
          食事を注文してイベントに参加する
        </v-btn>
      </v-col>
    </v-row>
  </v-navigation-drawer>
  <login-dialog v-model="isOpenLoginDialog" />
  <v-snackbar v-model="membershipState.snackbarVisible" :color="membershipState.snackbarColor" location="top">
    {{ membershipState.snackbarMessage }}
  </v-snackbar>
</template>
