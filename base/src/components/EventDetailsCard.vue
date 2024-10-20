<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMemberList from '@/components/EventMemberList.vue'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useEventStore, type EventStore } from '@/stores/event'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import CalendarAddDialog from '@/components/CalendarAddDialog.vue'
import { shareSnsButton } from '@/utils/shareSnsButton'
import ShowDialog from '@/components/ShowDialog.vue'
import VueQrious from 'vue-qrious'
import {
  mdiEmail,
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
import type { Shop } from '@/schemes/shop'
import { usePartnerStore } from '@/stores/partner'

const qrcodeSize = 300

const props = defineProps<{
  event: BokudeliEvent
  community: BokudeliCommunity
}>()

// コンポーネント内で pinia を直接たたくのはなるべく避けた方が良いが、このコンポーネントはかなり大きいので今の所は許容する
// TODO コンポーネントを分割する
const eventStore = useEventStore(props.event.event_id) as EventStore

const members = computed(
  () =>
    eventStore.members?.sort(
      (a, b) =>
        a.orders.reduce((max, order) => Math.max(max, order.updated_at.toMillis()), 0) -
        b.orders.reduce((max, order) => Math.max(max, order.updated_at.toMillis()), 0),
    ) ?? [],
)

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

const onShareSnsButtonClicked = async (type: 'twitter' | 'facebook' | 'line' | 'copy') => {
  const _window = type !== 'copy' ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const partnerStore = usePartnerStore(props.event.partner_id)
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
  await shareSnsButton(type, props.event, props.community, shop!, _window)
}
</script>

<template>
  <v-card class="align-center justify-center mt-0 mb-4 pa-sm-10 pa-xs-1">
    <v-row>
      <v-col>
        <v-img class="ma-0" cover aspect-ratio="1.91" :src="event.event_cover_url" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <!-- イベント情報 -->
        <v-card-title class="py-0 text-sm-h4 text-xs-h5 font-weight-bold pb-4 text-wrap" style="line-height: 1.3">
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
          {{ $d(event.event_start_datetime!.toDate(), 'datetime_weekday_short') }}
          〜
          {{ $d(event.event_end_datetime!.toDate(), 'time') }}
          <a @click="openCalendarAddDialog">
            <button><v-icon :icon="mdiCalendarPlus" /></button>
          </a>
        </v-card-text>
        <v-card-text class="event-item"> 【開催場所】 </v-card-text>
        <v-card-text class="event-content">
          {{ event.event_address }}
          <a :href="`https://www.google.co.jp/maps/search/${event.event_address} ${event.event_place}`" target="_blank">
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
          【お店】
          <span class="event-content">
            {{ event.shop_name }}
          </span>
        </v-card-text>
        <v-card-text class="event-item2">
          【注文期限】
          <span class="event-content">
            {{ $d(event.event_deadline_datetime!.toDate(), 'datetime_weekday_short') }}
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
              <router-link :to="{ path: `${event.event_id}/members` }">
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
                  :src="community.community_icon_image_url"
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
                  <div class="ma-1" style="font-size: 18px">{{ community.community_name }}</div>
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
                  :community-name="community.community_name"
                  :community-id="community.community_id"
                />
              </div>
            </v-row>
          </v-row>
        </v-card-text>
      </v-col>
    </v-row>
  </v-card>
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
        {{ event && $d(event.event_start_datetime!.toDate(), 'datetime_weekday_short') }}
        〜
        {{ event && $d(event.event_end_datetime!.toDate(), 'time') }}
      </v-card-text>
      <vue-qrious :value="event?.url ?? ''" :size="qrcodeSize" />
    </v-card>
  </show-dialog>
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
