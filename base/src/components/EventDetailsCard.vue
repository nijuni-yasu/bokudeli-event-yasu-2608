<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCommunityPath, getLogin } from '@/router/utils'
import { getEventUrl } from '@shokujii/common/utils/urls.js'
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import EventMemberList from '@shokujii/base/components/EventMemberList.vue'
import CommunityContactDialog from '@shokujii/base/components/CommunityContactDialog.vue'
import CancelPolicyDialog from '@shokujii/base/components/CancelPolicyDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useEventStore } from '@shokujii/base/stores/event'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type BokudeliCommunity } from '@shokujii/base/stores/community.js'
import CalendarAddDialog from '@shokujii/base/components/CalendarAddDialog.vue'
import { shareSnsButton, isMobileDevice } from '@shokujii/base/utils/shareSnsButton'
import ShowDialog from '@shokujii/base/components/ShowDialog.vue'
import CommunityMembershipButton from '@shokujii/base/components/CommunityMembershipButton.vue'
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
import XIcon from '@shokujii/base/icons/x'
import EventDiscountChip from '@shokujii/base/components/EventDiscountChip.vue'
import LineIcon from '@shokujii/base/icons/line'
import { type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { usePartnerStore } from '@shokujii/base/stores/partner'
import TinyMCEViewer from '@shokujii/base/components/TinyMCEViewer.vue'
import PublicAlbumGallery from '@shokujii/base/components/PublicAlbumGallery.vue'
import { extractImageSlidesFromHtml } from '@shokujii/base/utils/extractImagesFromHtml'

const router = useRouter()

const qrcodeSize = 300

const props = defineProps<{
  event: BokudeliEvent
  community: BokudeliCommunity
  /** イベントページでアルバムを横並び表示するときに渡す（Phase 2 想定） */
  albumImageUrls?: { id: string; url: string; caption: string }[]
}>()

const galleryAlbums = computed(() => (props.albumImageUrls ?? []).map((i) => ({ src: i.url, title: i.caption })))

const galleryDescImageSlides = computed(() => extractImageSlidesFromHtml(props.event.event_desc))

const communityStore = useCommunityStore(props.community.community_account)
const eventUrl = computed(() => {
  // TODO 環境変数を component 内で直接みるのはいまいちな実装なので直す
  return getEventUrl(import.meta.env.VITE_AUTH_DOMAIN, props.event.community_account, props.event.event_id)
})

// コンポーネント内で pinia を直接たたくのはなるべく避けた方が良いが、このコンポーネントはかなり大きいので今の所は許容する
// TODO コンポーネントを分割する
const eventStore = useEventStore(props.event.event_id)

const members = computed(() =>
  [...(eventStore.members ?? [])].sort(
    (a, b) =>
      a.orders.reduce((max, order) => Math.max(max, order.updated_at), 0) -
      b.orders.reduce((max, order) => Math.max(max, order.updated_at), 0),
  ),
)

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)
const isOpenCalendarAddDialog = ref(false)
const isShowQrCode = ref(false)
const isOpenCancelpolicyDialog = ref(false)

// コミュニティへの問い合わせはログイン必須
const currentUserStore = useCurrentUserStore()
const openContactDialog = () => {
  if (currentUserStore.firebaseUser == null) {
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

const login = () => {
  router.push({
    path: getLogin(),
  })
}

const onShareSnsButtonClicked = async (type: 'twitter' | 'facebook' | 'line' | 'copy') => {
  const skipNewWindow = type === 'copy' || (isMobileDevice() && type === 'twitter')
  const _window = !skipNewWindow ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const partnerStore = usePartnerStore(props.event.partner_id)
  const shop = await new Promise<BokudeliPartnerShop | undefined>((resolve) => {
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
// コミュニティの設定によっては参加者一覧を非表示にする
const isShowMember = computed(() =>
  props.community.is_show_member !== undefined ? props.community.is_show_member : true,
)
</script>

<template>
  <v-card class="align-center justify-center mt-0 mb-4 pa-1 pa-sm-10">
    <PublicAlbumGallery
      :cover-url="eventStore.coverImageUrl ?? ''"
      :cover-title="event.event_name"
      :albums="galleryAlbums"
      :lightbox-append-items="galleryDescImageSlides"
    />
    <v-row>
      <v-col>
        <!-- イベント情報 -->
        <v-card-title class="event-details-card__event-name pt-6 pb-0 font-weight-black text-wrap">
          {{ event.event_name }}
        </v-card-title>
        <v-card-text class="event-item text-right px-0 py-0 ma-1">
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
        <v-card-text class="text-h4 font-weight-black mt-6 pb-4">
          {{ $t('event_details.overview') }}
        </v-card-text>
        <v-divider class="custom-divider mt-0 mb-3" />
        <v-table class="custom-table mx-5 my-3" density="compact">
          <tbody>
            <tr>
              <td>
                {{ $t('event_details.date') }}
              </td>
              <td>
                {{ $d(event.event_start_datetime, 'datetime_weekday_short') }}
                〜
                {{ $d(event.event_end_datetime, 'time') }}
                <a @click="openCalendarAddDialog">
                  <button><v-icon :icon="mdiCalendarPlus" /></button>
                </a>
              </td>
            </tr>
            <tr>
              <td>{{ $t('event_details.place') }}</td>
              <td>
                <div>
                  {{ event.fullAddress }}
                  <a
                    :href="`https://www.google.co.jp/maps/search/${event.fullAddress} ${event.event_place}`"
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
              <td>
                {{
                  $t(
                    event.event_payment === 'community_bill'
                      ? event.community_bill_settings?.type === 'discount'
                        ? 'payment.community_bill_discount'
                        : 'payment.community_bill_free'
                      : `payment.${event.event_payment}`,
                  )
                }}
                <EventDiscountChip
                  v-if="event.event_payment === 'community_bill' && event.community_bill_settings != null"
                  :settings="event.community_bill_settings"
                  size="x-small"
                  class="ml-1"
                />
              </td>
            </tr>
            <tr>
              <td>{{ $t('event_details.deadline') }}</td>
              <td>{{ $d(event.event_deadline_datetime, 'datetime_weekday_short') }}</td>
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
        <v-card-text class="text-h4 font-weight-black mt-6 pb-4">
          {{ $t('event_details.event_details') }}
        </v-card-text>
        <v-divider class="custom-divider mt-0 mb-3" />
        <v-card-text class="pt-0">
          <tiny-m-c-e-viewer :content="event.event_desc" class="event-content" />
        </v-card-text>

        <div class="mb-6">
          <v-card-text class="mt-6 pb-3">
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="text-h4 font-weight-black">
                {{ $t('event_details.participants') }}
                <span class="text-h5"> {{ members.length }} / {{ event.event_max_people }} </span>
              </span>
              <v-spacer />
              <template v-if="members.length > 0">
                <div v-if="isShowMember === true">
                  <router-link :to="{ path: `${event.event_id}/members` }">
                    <div class="d-flex align-end">
                      <v-icon size="large" :icon="mdiAccountGroup" />
                      <span class="ml-2" style="font-size: 16px">
                        {{ $t('event_details.participants_profile') }}
                      </span>
                    </div>
                  </router-link>
                </div>
                <div v-else-if="isShowMember === false" class="text-subtitle-2 text-right text-medium-emphasis">
                  {{ $t('event_details.participants_profile_hidden') }}
                </div>
              </template>
            </div>
          </v-card-text>
          <v-divider class="custom-divider mt-0 mb-2" />
          <event-member-list
            v-if="members.length > 0"
            :members="members"
            :event-max-people="event.event_max_people"
            :is-show-member="isShowMember"
          />
        </div>
        <v-card-text class="px-5">
          <v-row align="center" no-gutters class="flex-nowrap">
            <v-col cols="auto" class="d-flex justify-start flex-shrink-0">
              <router-link :to="getCommunityPath(event.community_account)">
                <v-img :src="communityStore.iconImageUrl" class="community-icon" aspect-ratio="1" cover />
              </router-link>
            </v-col>
            <v-col class="flex-grow-1 min-width-0 pl-3">
              <router-link
                :to="getCommunityPath(event.community_account)"
                class="text--primary cursor-pointer text-decoration-none d-block"
              >
                <div class="community-name-label">{{ $t('event_details.community_name') }}</div>
                <div class="community-name-text text-wrap">{{ community.community_name }}</div>
              </router-link>
              <v-row class="community-actions mt-2" align="center" justify="start" no-gutters>
                <v-col cols="12" sm="auto" class="pa-0">
                  <v-btn
                    variant="outlined"
                    rounded="pill"
                    size="small"
                    :prepend-icon="mdiEmail"
                    block
                    @click="openContactDialog"
                  >
                    {{ $t('event_details.contact_community') }}
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="auto" class="pa-0">
                  <community-membership-button
                    v-if="community.community_account"
                    :community-id="community.community_account"
                    block
                    :join-button-props="{
                      rounded: 'pill',
                      size: 'small',
                      'prepend-icon': mdiAccountGroup,
                    }"
                    :leave-button-props="{
                      variant: 'outlined',
                      rounded: 'pill',
                      size: 'small',
                      'prepend-icon': mdiAccountGroup,
                    }"
                  />
                </v-col>
              </v-row>
              <community-contact-dialog
                v-model="isOpenContactDialogVisible"
                :community-name="community.community_name"
                :community-id="community.community_id"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-col>
    </v-row>
  </v-card>
  <CancelPolicyDialog v-model="isOpenCancelpolicyDialog" />
  <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="false" :ok-click="login">
    {{ $t('event_details.contact_community_after_login') }}
  </confirm-dialog>
  <calendar-add-dialog v-model="isOpenCalendarAddDialog" :event="event!" />
  <show-dialog v-model="isShowQrCode">
    <v-card class="justify-center text-center" elevation="0">
      <v-card-text>
        {{ event?.event_name }}
      </v-card-text>
      <v-card-text>
        {{ event && $d(event.event_start_datetime, 'datetime_weekday_short') }}
        〜
        {{ event && $d(event.event_end_datetime, 'time') }}
      </v-card-text>
      <vue-qrious :value="eventUrl" :size="qrcodeSize" />
    </v-card>
  </show-dialog>
</template>
<style lang="scss" scoped>
/* text-h4 は付けない（Vuetify の font-size が !important で競合するため）。ここで xs / sm を定義 */
.event-details-card__event-name {
  line-height: 1.3;
  font-size: 1.5rem; /* 従来 text-h4 相当 24px @ 16px root */

  @media (min-width: 600px) {
    font-size: 2.125rem; /* 34px @ 16px root */
  }
}

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

.community-icon {
  border-radius: 10%;
  width: 80px;
  height: 80px;

  @media (min-width: 600px) {
    width: 100px;
    height: 100px;
  }
}

.community-actions {
  gap: 12px;
}

.community-name-label {
  font-size: 12px;
}

.community-name-text {
  font-size: 24px;
}

@media (min-width: 600px) {
  .community-name-text {
    padding-top: 2px;
    padding-bottom: 8px;
  }
}

@media (max-width: 600px) {
  .community-name-text {
    font-size: 16px;
    line-height: 1.2;
  }
}
</style>
