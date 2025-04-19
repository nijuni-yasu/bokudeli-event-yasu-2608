<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMemberList from '@/components/EventMemberList.vue'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import CancelPolicyDialog from '@/components/CancelPolicyDialog.vue'
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
  mdiHelpCircleOutline,
} from '@mdi/js'
import XIcon from '@/icons/x'
import LineIcon from '@/icons/line'
import type { Shop } from '@/schemes/shop'
import { usePartnerStore } from '@/stores/partner'
import TinyMCEViewer from '@/components/TinyMCEViewer.vue'

const router = useRouter()
const route = useRoute()


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
const isOpenCancelpolicyDialog = ref(false)

// コミュニティへの問い合わせはログイン必須
const userStore = useStoreStoredUser()
const openContactDialog = () => {
  if (!userStore.storedUser) {
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
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
        <v-img class="ma-0 pa-0" cover aspect-ratio="1.91" :src="event.event_cover_url" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <!-- イベント情報 -->
        <v-card-title class="py-0 text-sm-h3 text-h4 font-weight-black text-wrap" style="line-height: 1.3">
          {{ event.event_name }}
        </v-card-title>
        <v-card-text class="event-item text-right px-0 ma-1">
          <v-btn
            class="ml-3"
            :icon="XIcon"
            elevation="2"
            color="grey-900"
            size="large"
            density="compact"
            variant="text"
            @click="onShareSnsButtonClicked('twitter')"
          ></v-btn>
          <v-btn
            class="ml-3"
            :icon="mdiFacebook"
            elevation="2"
            color="#1877F2"
            size="large"
            density="compact"
            variant="text"
            @click="onShareSnsButtonClicked('facebook')"
          ></v-btn>
          <v-btn
            class="ml-3"
            :icon="LineIcon"
            elevation="2"
            color="#06c755"
            size="large"
            density="compact"
            variant="text"
            @click="onShareSnsButtonClicked('line')"
          ></v-btn>
          <v-btn
            class="ml-3"
            :icon="mdiQrcode"
            elevation="2"
            color="grey-900"
            size="large"
            density="compact"
            variant="text"
            @click="showQrCode()"
          ></v-btn>
          <v-btn
            class="mx-3"
            :icon="mdiContentCopy"
            elevation="2"
            color="grey-900"
            size="large"
            density="compact"
            variant="text"
            @click="onShareSnsButtonClicked('copy')"
          ></v-btn>
        </v-card-text>
        <v-card-text class="text-h4 font-weight-black mt-5 pb-3">
          {{ $t('event_details.overview') }}
        </v-card-text>
        <v-divider class="custom-divider pt-1" />
        <v-table class="custom-table mx-5 my-3" density="compact">
          <tbody>
            <tr>
              <td>
                {{ $t('event_details.date') }}
              </td>
              <td>
                {{ $d(event.event_start_datetime!.toDate(), 'datetime_weekday_short') }}
                〜
                {{ $d(event.event_end_datetime!.toDate(), 'time') }}
                <a @click="openCalendarAddDialog">
                  <button><v-icon :icon="mdiCalendarPlus" /></button>
                </a>
              </td>
            </tr>
            <tr>
              <td>{{ $t('event_details.place') }}</td>
              <td>
                <div>
                  {{ event.event_address }}
                  <a
                    :href="`https://www.google.co.jp/maps/search/${event.event_address} ${event.event_place}`"
                    target="_blank"
                  >
                    <v-icon :icon="mdiMapMarkerRadius" />
                  </a>
                </div>
                <div>
                  <div v-if="event.event_place_url && event.event_place">
                    {{ event.event_place }}
                    <a :href="event.event_place_url" target="_blank">
                      <v-icon size="small" :icon="mdiOpenInNew" />
                    </a>
                  </div>
                  <div v-else-if="!event.event_place_url && event.event_place">
                    {{ event.event_place }}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>{{ $t('event_details.shop') }}</td>
              <td>{{ event.shop_name }}</td>
            </tr>
            <tr>
              <td>{{ $t('event_details.payment') }}</td>
              <td>{{ $t(`payment.${event.event_payment}`) }}</td>
            </tr>
            <tr>
              <td>{{ $t('event_details.deadline') }}</td>
              <td>{{ $d(event.event_deadline_datetime!.toDate(), 'datetime_weekday_short') }}</td>
            </tr>
            <tr>
              <td>{{ $t('event_details.cancel') }}</td>
              <td>
                {{ $t('event_details.cancel_until_deadline') }}
                <span>
                  <v-btn
                    :icon="mdiHelpCircleOutline"
                    class="pa-0"
                    color="primary"
                    density="compact"
                    variant="text"
                    @click="isOpenCancelpolicyDialog = true"
                  >
                  </v-btn>
                </span>
              </td>
            </tr>
            <tr>
              <td class="text-small">
                {{ $t('event_details.sns_hash_tag') }}
              </td>
              <td v-if="typeof event.event_sns_hash_tag === 'string' && event.event_sns_hash_tag.trim() !== ''">
                <a
                  :href="`https://twitter.com/search?q=%23${event.event_sns_hash_tag}&f=live`"
                  target="_blank"
                  class="text-decoration-none"
                >
                  #{{ event.event_sns_hash_tag }}
                </a>
              </td>
              <td v-else>ー</td>
            </tr>
          </tbody>
        </v-table>
        <v-card-text class="text-h4 font-weight-black mt-5 pb-3">
          {{ $t('event_details.event_details') }}
        </v-card-text>
        <v-divider class="custom-divider pt-2" />
        <v-card-text class="pt-0">
          <tiny-m-c-e-viewer :content="event.event_desc" class="event-content" />
        </v-card-text>

        <div v-if="members.length > 0">
          <v-row class="mt-5 px-4 d-flex align-center">
            <v-card-text class="text-h4 font-weight-black pb-3">
              {{ $t('event_details.participants') }}
              <span class="text-h5"> {{ members.length }} / {{ event.event_max_people }} </span>
            </v-card-text>
            <v-spacer />
            <v-col cols="auto">
              <router-link :to="{ path: `${event.event_id}/members` }">
                <div class="d-flex align-end">
                  <v-icon size="large" :icon="mdiAccountGroup" />
                  <span class="ml-2" style="font-size: 16px">
                    {{ $t('event_details.participants_profile') }}
                  </span>
                </div>
              </router-link>
            </v-col>
          </v-row>
          <v-divider class="custom-divider mt-2" />
          <event-member-list :members="members" :event-max-people="event.event_max_people" class="mt-4 mb-8" />
        </div>
        <v-card-text>
          <v-row align-self-center>
            <v-row class="ma-1">
              <router-link :to="getCommunityPath(event.community_account)">
                <v-img
                  :src="community.community_icon_image_url"
                  style="border-radius: 10%; width: 100px; height: 100px"
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
                  <div class="ma-1" style="font-size: 12px">{{ $t('event_details.community_name') }}</div>
                  <div class="ma-1" style="font-size: 18px">{{ community.community_name }}</div>
                </router-link>
                <v-btn
                  class="ma-1"
                  variant="outlined"
                  rounded="pill"
                  :prepend-icon="mdiEmail"
                  @click="openContactDialog"
                >
                  {{ $t('event_details.contact_community') }}
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
  <CancelPolicyDialog v-model="isOpenCancelpolicyDialog" />
  <confirm-dialog
      v-model="isOpenConfirmDialog"
      :is-confirm="false"
      @click="login"
  >
    {{ $t('event_details.contact_community_after_login') }}
  </confirm-dialog>
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
.event-content {
  padding-bottom: 0px;
  color: #2e263db3;
  font-family:
    'Inter',
    sans-serif,
    -apple-system,
    blinkmacsystemfont,
    'Segoe UI',
    roboto,
    'Helvetica Neue',
    arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol';
}

iframe {
  width: 100%;
  border: none;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

.custom-divider {
  width: 100%;
  margin: 0 auto;
  border-color: #333;
}
.custom-table td:first-child {
  width: 18%; /* 1列目の幅を設定 */
  // font-weight: bold;
  white-space: nowrap;
  font-size: 15px;
}
.custom-table {
  border-collapse: collapse;
  width: 90%;
  font-size: 15px;
}
.custom-table td {
  padding: 6px !important;
  border: 0px none !important;
  // vertical-align: top;
}
.text-small {
  font-size: 14px !important;
}
</style>
