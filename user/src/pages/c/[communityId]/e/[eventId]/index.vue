<script setup lang="ts">
import { getEventEditBasicPath, getEventEditDetailsPath, getEventEditShopNoticePath } from '@/router/utils'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import EventCartDialog from '@/components/EventCartDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMenuList from '@/components/EventMenuList.vue'
import { useEventStore, type EventStore } from '@/stores/event'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { useI18n } from 'vue-i18n'
import { mdiEmail, mdiPencilBoxOutline, mdiFoodForkDrink, mdiHome } from '@mdi/js'
import EventDetailsCard from '@/components/EventDetailsCard.vue'

const communityId = useRoute().params.communityId as string
const eventId = useRoute().params.eventId as string

const { t: $t } = useI18n()

const eventStore = useEventStore(eventId) as EventStore
const communityStore = useCommunityStore(communityId) as CommunityStore
const menuNavigation = ref(true)
const menuListRef = ref()
let menuListObserver: IntersectionObserver | null = null

const isManager = ref(false)
communityStore.getCurrentUserRoles().then((roles) => {
  isManager.value = roles?.includes('manager') ?? false
})

const event = computed<BokudeliEvent | null>(() => eventStore.event)

type MenuDisabledReason = 'finished' | 'order_closed' | 'not_accepting_order' | 'limit_people'

const menuDisabled = computed<null | false | MenuDisabledReason>(() => {
  if (event.value == null) {
    return null
  }
  switch (event.value.event_status.value) {
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
  menu: null as PartnerMenu | null,
  isOpen: false,
})

const alertState = reactive({
  message: '',
  isOpen: false,
})

const selectMenu = (menu: PartnerMenu) => {
  const disabledReason = menu.isSoldout ? 'sold_out' : menuDisabled.value
  if (disabledReason == null) {
    return
  }
  if (menuDisabled.value === 'finished') {
    alertState.message = $t(`menu_disabled_reason.finished`)
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
  get: () =>  {
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
  get: () =>  {
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
  get: () =>  {
    if (fewMemberNotice.value === null) {
      if (event.value != null) {
        return event.value.event_num_members < 3 && event.value.is_public && isManager.value && event.value.event_status.value === 'accepting_order'
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
          <v-chip v-if="!event.is_public" color="primary" size="large">
            {{ $t('private_event') }}
          </v-chip>
          <v-chip color="primary" size="large">
            {{ $t(`event_status.${event.event_status.value}`) }}
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
              (event.event_status.value === 'in_draft' ||
                event.event_status.value === 'full' ||
                event.event_status.value === 'applying_reservation' ||
                event.event_status.value === 'accepting_order') &&
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
        <EventDetailsCard :event="event" :community="communityStore.community" />
        <!-- メニュ -->
        <event-menu-list
          ref="menuListRef"
          :event="event"
          :disabled="menuDisabled !== false"
          @select-menu="selectMenu"
        />
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
    <v-card-text class="pb-0" style="line-height: 2.0rem">
      <div v-html="$t('event_draft_notice_modal.desc')"></div>
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isApplyingNotice" :ok-text="'OK'" max-width="700px">
    <v-card-text class="text-center py-10 text-h4">
      <div v-html="$t('event_applying_notice_modal.title')"></div>
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.0rem">
      <div v-html="$t('event_applying_notice_modal.desc')"></div>
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isFewMemberNotice" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-10 text-h4">
      <div v-html="$t('event_few_members_notice_modal.title')"></div>
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.0rem">
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
    style="height: 60px; z-index: 100; text-align: center"
  >
    <v-row class="justify-center mb-2">
      <v-col md="8" sm="9" cols="12">
        <v-btn
          class="text-h5"
          size="large"
          rounded="pill"
          elevation="10"
          :prepend-icon="mdiFoodForkDrink"
          color="primary"
          width="90%"
          @click="scrollToMenu"
        >
          食事を注文してイベントに参加する
        </v-btn>
      </v-col>
    </v-row>
  </v-navigation-drawer>
</template>
