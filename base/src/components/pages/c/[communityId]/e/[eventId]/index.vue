<script setup lang="ts">
/* Deprecated 
   Use the components like `user/src/pages/c/[communityId]/e/[eventId]/index.vue` instead.
*/
import { getCommunityPath, getEventEditPath } from '@/router/utils'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import EventCartDialog from '@/components/EventCartDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMemberList from '@/components/EventMemberList.vue'
import EventMenuList from '@/components/EventMenuList.vue'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useEventStore, type EventStore } from '@/stores/event'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import CalendarAddDialog from '@/components/CalendarAddDialog.vue'
import { shareSnsButton } from '@/utils/shareSnsButton'
import ShowDialog from '@/components/ShowDialog.vue'
import VueQrious from 'vue-qrious'
import { useI18n } from 'vue-i18n'
import {
  mdiEmail,
  mdiPencilBoxOutline,
  mdiFoodForkDrink,
  mdiHome,
  mdiFacebook,
  mdiQrcode,
  mdiContentCopy,
  mdiCalendarPlus,
  mdiMapMarkerRadius,
  mdiOpenInNew,
  mdiAccountGroup,
} from '@mdi/js'
import XIcon from '@/icons/x'
import LineIcon from '@/icons/line'
import { usePartnerStore } from '@/stores/partner'
import type { Shop } from '@/schemes/shop'

const qrcodeSize = 300

const props = defineProps<{
  communityId: string
  eventId: string
}>()

const { t: $t } = useI18n()

const eventStore = useEventStore(props.eventId) as EventStore
const communityStore = useCommunityStore(props.communityId) as CommunityStore
const menuNavigation = ref(true)
const menuListRef = ref()
let menuListObserver: IntersectionObserver | null = null

const isManager = ref(false)
communityStore.getCurrentUserRoles().then((roles) => {
  isManager.value = roles?.includes('manager') ?? false
})

const event = computed<BokudeliEvent | null>(() => eventStore.event)
const members = computed(
  () =>
    eventStore.members?.sort(
      (a, b) =>
        a.orders.reduce((max, order) => Math.max(max, order.updated_at.toMillis()), 0) -
        b.orders.reduce((max, order) => Math.max(max, order.updated_at.toMillis()), 0),
    ) ?? [],
)

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

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)
const isOpenLoginDialog = ref(false)
const isOpenCalendarAddDialog = ref(false)
const isShowQrCode = ref(false)

// コミュニティへの問い合わせはログイン必須
const userStore = useStoreStoredUser()
const openContactDialog = () => {
  if (!userStore.storedUser) {
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
}
const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}

const openCalendarAddDialog = () => {
  isOpenCalendarAddDialog.value = true
}

const showQrCode = () => {
  isShowQrCode.value = true
}

const scrollToMenu = () => {
  // Vuetify では scrollIntoView が使えないらしい
  // menuList.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const top = menuListRef.value?.$el?.offsetTop
  window.scrollTo({ top, behavior: 'smooth' })
}

const onShareSnsButtonClicked = async (type: 'twitter' | 'facebook' | 'line' | 'copy') => {
  const _window = type !== 'copy' ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const partnerStore = usePartnerStore(event.value!.partner_id)
  const shop = await new Promise<Shop | undefined>((resolve) => {
    watch(
      () => partnerStore.shops,
      (shops) => {
        if (shops != null) {
          resolve(shops[0])
          stop()
        }
      },
      { immediate: true },
    )
  })
  await shareSnsButton(type, event.value!, communityStore.community!, shop!, _window)
}

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
  <section>
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
              :to="{
                path: getEventEditPath(props.eventId),
              }"
            >
              店舗へ予約申請
            </v-btn>
            <v-btn
              v-if="(event.event_status.value == 'in_draft' || event.event_status.value == 'full') && isManager"
              color="white"
              class="ml-2 my-1"
              elevation="5"
              rounded="pill"
              :prepend-icon="mdiPencilBoxOutline"
              :to="{
                path: getEventEditPath(props.eventId),
              }"
            >
              イベント編集
            </v-btn>
            <v-btn
              v-if="
                (event.event_status.value == 'applying_reservation' ||
                  event.event_status.value == 'accepting_order' ||
                  event.event_status.value == 'order_closed') &&
                isManager
              "
              color="white"
              class="my-1"
              elevation="5"
              rounded="pill"
              :prepend-icon="mdiPencilBoxOutline"
              :to="{
                path: getEventEditPath(props.eventId),
              }"
            >
              イベント編集
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
      <v-row class="justify-center">
        <v-col md="8" sm="9" cols="12" class="mt-0 pt-0 px-0">
          <v-card class="align-center justify-center mt-0 mb-4 pa-sm-10 pa-xs-1">
            <v-row>
              <v-col>
                <v-img class="ma-0" cover aspect-ratio="1.91" :src="event.event_cover_url" />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <!-- イベント情報 -->
                <v-card-title
                  class="py-0 text-sm-h4 text-xs-h5 font-weight-bold pb-4 text-wrap"
                  style="line-height: 1.3"
                >
                  {{ event.event_name }}
                </v-card-title>
                <v-card-text class="event-item text-right px-0 ma-1">
                  <v-btn
                    class="ml-1"
                    :icon="XIcon"
                    color="grey-900"
                    size="x-large"
                    density="compact"
                    variant="text"
                    @click="onShareSnsButtonClicked('twitter')"
                  ></v-btn>
                  <v-btn
                    class="ml-1"
                    :icon="mdiFacebook"
                    color="#1877F2"
                    size="x-large"
                    density="compact"
                    variant="text"
                    @click="onShareSnsButtonClicked('facebook')"
                  ></v-btn>
                  <v-btn
                    class="ml-1"
                    :icon="LineIcon"
                    color="#06c755"
                    size="x-large"
                    density="compact"
                    variant="text"
                    @click="onShareSnsButtonClicked('line')"
                  ></v-btn>
                  <v-btn
                    class="ml-1"
                    :icon="mdiQrcode"
                    color="grey-900"
                    size="x-large"
                    density="compact"
                    variant="text"
                    @click="showQrCode()"
                  ></v-btn>
                  <v-btn
                    class="mx-1"
                    :icon="mdiContentCopy"
                    color="grey-900"
                    size="x-large"
                    density="compact"
                    variant="text"
                    @click="onShareSnsButtonClicked('copy')"
                  ></v-btn>
                </v-card-text>
                <v-card-text class="event-item"> 【開催日時】 </v-card-text>
                <v-card-text class="event-content">
                  {{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
                    dateOnlyTimeString(event.event_end_datetime)
                  }}
                  <a @click="openCalendarAddDialog">
                    <button><v-icon :icon="mdiCalendarPlus" /></button>
                  </a>
                </v-card-text>
                <v-card-text class="event-item"> 【開催場所】 </v-card-text>
                <v-card-text class="event-content">
                  {{ event.event_address }}
                  <a
                    :href="`https://www.google.co.jp/maps/search/${event.event_address} ${event.event_place}`"
                    target="_blank"
                  >
                    <v-icon :icon="mdiMapMarkerRadius" />
                  </a>
                  <div v-if="event.event_place_url && event.event_place">
                    {{ event.event_place }}
                    <a :href="event.event_place_url" target="_blank">
                      <v-icon size="small" :icon="mdiOpenInNew" />
                    </a>
                  </div>
                  <div v-else-if="!event.event_place_url && event.event_place">
                    {{ event.event_place }}
                  </div>
                </v-card-text>
                <v-card-text class="event-item"> 【開催内容】 </v-card-text>
                <v-card-text v-linkify class="event-content">
                  {{ event.event_desc }}
                </v-card-text>
                <v-card-text class="event-item2">
                  【食事】
                  <span class="event-content">
                    {{ event.shop_name }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【注文期限】
                  <span class="event-content">
                    {{ dateWithDayOfWeekString(event.event_deadline_datetime) }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【支払い方法】
                  <span class="event-content">
                    {{ $t(`payment.${event.event_payment}`) }}
                  </span>
                </v-card-text>
                <!-- <v-card-text class="event-item2">
                  【定員】
                  <span class="event-content">
                    {{ event.event_max_people }} 人
                  </span>
                </v-card-text> -->
                <!-- メンバー情報 -->
                <event-member-list :members="members" :event-max-people="event.event_max_people">
                  <v-row>
                    <v-spacer />
                    <v-col v-if="members.length > 0" cols="auto">
                      <router-link :to="{ path: `${eventId}/members` }">
                        <div class="d-flex align-end">
                          <v-icon size="large" :icon="mdiAccountGroup" />
                          <span class="ml-2" style="font-size: 18px">参加者一覧</span>
                        </div>
                      </router-link>
                    </v-col>
                  </v-row>
                </event-member-list>
                <v-card-text>
                  <v-row align-self-center>
                    <v-row class="ma-1">
                      <router-link :to="getCommunityPath(event.community_account)">
                        <v-img
                          :src="communityStore.community.community_icon_image_url"
                          style="border-radius: 10px; width: 100px; height: 100px"
                          aspect-ratio="1"
                          cover
                          max-width="100px"
                        />
                      </router-link>
                      <div class="ml-2 align-self-end">
                        <router-link
                          :to="getCommunityPath(event.community_account)"
                          class="text--primary cursor-pointer text-decoration-none"
                        >
                          <div class="ma-1" style="font-size: 12px">【主 催 者】</div>
                          <div class="ma-1" style="font-size: 18px">{{ communityStore.community.community_name }}</div>
                        </router-link>
                        <v-btn
                          class="ma-1"
                          variant="outlined"
                          rounded="pill"
                          :prepend-icon="mdiEmail"
                          @click="openContactDialog"
                        >
                          主催者に連絡
                        </v-btn>
                        <community-contact-dialog
                          v-model="isOpenContactDialogVisible"
                          :community-name="communityStore.community.community_name"
                          :community-id="communityStore.community.community_id"
                        />
                      </div>
                    </v-row>
                  </v-row>
                </v-card-text>
              </v-col>
            </v-row>
          </v-card>
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
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
      ログインした後に主催者に連絡してください。
    </confirm-dialog>
    <login-dialog v-model="isOpenLoginDialog" />
    <calendar-add-dialog v-model="isOpenCalendarAddDialog" :event="event!" />
    <show-dialog v-model="isShowQrCode">
      <v-card class="justify-center text-center" elevation="0">
        <v-card-text>
          {{ event?.event_name }}
        </v-card-text>
        <v-card-text>
          {{ event && dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
            event && dateOnlyTimeString(event.event_end_datetime)
          }}
        </v-card-text>
        <vue-qrious :value="event?.url ?? ''" :size="qrcodeSize" />
      </v-card>
    </show-dialog>
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
  </section>
</template>
<style lang="scss" scoped>
.event-item {
  font-size: 14px;
  padding-bottom: 2px;
  font-weight: 600;
}
.event-item2 {
  font-size: 14px;
  padding-bottom: 16px;
  font-weight: 600;
}
.event-content {
  font-size: 16px;
  padding-bottom: 16px;
  font-weight: 400;
  line-height: 32px;
  white-space: pre-line;
}
</style>
