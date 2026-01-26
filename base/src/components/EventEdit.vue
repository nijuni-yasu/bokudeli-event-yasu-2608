<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
import { isInShopTime } from '@shokujii/common/utils/datetime.js'
import EventBasicInfoCard from '@shokujii/base/components/eventcreate/EventBasicInfoCard.vue'
import EventShop from '@shokujii/base/components/eventcreate/EventShop.vue'
import EventMenu from '@shokujii/base/components/eventcreate/EventMenu.vue'
import EventDetailCard from '@shokujii/base/components/eventcreate/EventDetailCard.vue'
import EventShopNotice from '@shokujii/base/components/eventcreate/EventShopNotice.vue'
import { BokudeliEvent, createNewEvent } from '@shokujii/base/stores/event.js'
import { usePartnerStore, type BokudeliPartnerMenu, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useShopListStore } from '@shokujii/base/stores/shopList'
import { useRouter } from 'vue-router'
import { getCommunityPath } from '@/router/utils'
import { calculateDistance, fetchLocationByPostalcode, LatLogLocation } from '@shokujii/base/composable/fetchLocation'
import { maxBy } from 'lodash'
import { useValidators } from '@shokujii/base/composable/validators'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'

import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()

const router = useRouter()

const props = defineProps<{
  communityAccount: string
  eventId?: string
  step?: string
}>()

const emits = defineEmits<{
  updated: [id: string]
}>()

const { postalCodeValidator } = useValidators()

const isValid1 = ref(false)
const isValid4 = ref(false)

const communityStore = useCommunityStore(props.communityAccount) as CommunityStore

const isOpenContactDialogVisible = ref(props.eventId == null)

const _event = ref<BokudeliEvent | null>(null)

// Initialize _event when community data becomes available
watch(
  () => communityStore.community,
  (community) => {
    if (props.eventId == null && _event.value == null && community != null) {
      // コミュニティ名が取得できない場合は空文字列を使用
      const communityName = community.community_name || ''
      const eventName = communityName ? `${communityName}のイベント` : ''
      const eventDesc = communityName ? `${communityName}のイベント` : ''

      _event.value = new BokudeliEvent(community.community_id, null, {
        community_id: community.community_id,
        community_name: community.community_name,
        community_account: community.community_account,
        organizer_fullname: community.community_manager_fullname,
        organizer_company: community.community_company,
        organizer_email: community.community_email,
        organizer_phone_company: community.community_phone,
        // 初期値の設定
        event_name: eventName,
        event_cover_url: community.community_cover_image_url ?? '',
        event_desc: eventDesc,
      })
    }
  },
  { immediate: true },
)

const event = computed<BokudeliEvent | null>({
  get: () => {
    if (props.eventId != null) {
      const eventStore = useEventStore(props.eventId) as EventStore
      return eventStore.event
    } else {
      return _event.value
    }
  },
  set: (value) => {
    if (value == null) {
      return
    }
    if (props.eventId != null) {
      const eventStore = useEventStore(props.eventId) as EventStore
      eventStore.event = value
    } else {
      _event.value = value
    }
  },
})

const location = ref<LatLogLocation | null>(null)
watch(
  () => event.value?.event_postalcode,
  async (postalcode) => {
    if (postalcode === undefined || postalCodeValidator(postalcode) !== true) {
      location.value = null
    } else {
      location.value = await fetchLocationByPostalcode(postalcode)
    }
  },
)

const coverImage = ref<File | null>(null)

type BokudeliPartnerShopWithExtras = BokudeliPartnerShop & {
  distance: number
  min_orders_on_spot: number
}
const shops = computed<BokudeliPartnerShopWithExtras[] | undefined>(() => {
  const selectedLocation = location.value
  if (selectedLocation == null) {
    return undefined
  }
  const shopListStore = useShopListStore([])
  return shopListStore.shops
    ?.map((shop) => {
      // calculate distance
      let distance = 0
      if (shop.shop_address_longitude != null && shop.shop_address_latitude != null) {
        const shopLocation = {
          longitude: shop.shop_address_longitude,
          latitude: shop.shop_address_latitude,
        }
        distance = calculateDistance(selectedLocation, shopLocation)
      }
      // 最小注文個数の配列の何番目かを取得
      const rangeIndex = shop.shop_range_min_orders.findIndex(
        (order) => order?.range != null && order.range >= distance,
      )
      // 最小注文個数（注文の目安）を取得。値がない場合は30に設定
      const min_orders_on_spot = shop.shop_range_min_orders[rangeIndex]?.min_orders ?? 30
      return Object.assign(Object.create(Object.getPrototypeOf(shop)), shop, {
        distance,
        min_orders_on_spot,
      })
    })
    .filter((shop: BokudeliPartnerShopWithExtras) => {
      // check distance
      const distance = shop.distance
      const maxRange = maxBy(shop.shop_range_min_orders, 'range')?.range
      const isInRange = maxRange ? distance <= maxRange : false

      // check time
      const eventTimeStart = event.value?.event_start_datetime
      if (eventTimeStart == null) {
        return false
      }
      const isInTime = isInShopTime(eventTimeStart, shop)
      return isInRange && isInTime && shop.is_approved && shop.is_open
    })
    .sort((a, b) => a.min_orders_on_spot - b.min_orders_on_spot)
})

const selectedShop = computed((): BokudeliPartnerShop | null => {
  if (event.value == null) {
    return null
  }
  return shops.value?.find((shop) => shop.shop_id === event.value?.shop_id) ?? null
})

const currentUserStore = useCurrentUserStore()

// @ts-expect-error parseInt can take no string params, then return NaN
const stepQuery = Number.parseInt(props.step)
const stepper = ref(Number.isNaN(stepQuery) ? 1 : stepQuery)

const isLoadingMenu = ref(false)

const isUpdatedStartTime = ref(false)

// Fetch Menus
// 本来 watch をつかわず computed のみで対応できるが loading 等、過去の資産を使うために残す。TODO: 修正する。
const menus = ref<BokudeliPartnerMenu[]>([])
watch(
  () => event.value?.partner_id,
  async () => {
    const partnerId = event.value?.partner_id
    if (!partnerId) {
      return
    }
    isLoadingMenu.value = true
    const partenrStore = usePartnerStore(partnerId)
    watch(
      () => partenrStore.menus,
      (ms) => {
        if (ms != null) {
          menus.value = ms
          isLoadingMenu.value = false
        }
      },
      { immediate: true },
    )
  },
  { immediate: true },
)

watch(
  () => communityStore.community?.is_approved,
  (is_approved) => {
    if (is_approved === false) {
      window.alert('コミュニティが承認されていません')
      router.push(getCommunityPath(props.communityAccount))
    }
  },
  { immediate: true },
)

// 開始日時が更新されたかどうかを監視
watch(
  () => event.value?.event_start_datetime,
  (newStartDateTime, oldStartDateTime) => {
    if (!newStartDateTime || !oldStartDateTime) {
      return
    }
    if (newStartDateTime !== oldStartDateTime) {
      isUpdatedStartTime.value = true
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const roles = await communityStore.getCurrentUserRoles()
  if (roles == null || !roles.includes('manager')) {
    window.alert('コミュニティ運営者ではありません')
    router.push(getCommunityPath(props.communityAccount))
  }
})

onUnmounted(() => {
  if (props.eventId != null) {
    const eventStore = useEventStore(props.eventId) as EventStore
    eventStore.$reset()
  }
})

const saveDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  if (props.eventId == null) {
    // event_cover_urlが既に設定されている場合はcoverImage.valueがnullでもOK
    if (coverImage.value == null && !event.value.event_cover_url) {
      return null
    }
    // 新規作成
    event.value.community_id = communityId
    event.value.created_by = handleUserId
    event.value.updated_by = handleUserId
    return await createNewEvent(toRaw(event.value), coverImage.value)
  } else {
    // 更新
    event.value.updated_by = handleUserId
    const eventStore = useEventStore(props.eventId) as EventStore
    await eventStore.updateEvent(event.value)
    if (coverImage.value != null) {
      await eventStore.updateCoverImage(coverImage.value)
    }
    return event.value
  }
}

const submit = async () => {
  const event = await saveDraft()
  if (event?.event_id == null || event?.community_account == null) {
    console.warn('Could not save event')
    return
  }
  if (event?.event_id == null) {
    window.alert(`「${event.event_name}」のイベントを新規作成しました`)
  } else {
    window.alert(`「${event.event_name} 」のイベントを更新しました`)
  }
  emits('updated', event.event_id)
}

const sendReserveMail = async () => {
  const event = await saveDraft()
  if (event?.event_id == null || event?.community_id == null || event?.community_account == null) {
    // eslint-disable-next-line quotes
    console.warn("The event doesn't have enough information.", event)
    return
  }
  event.event_status = { value: 'applying_reservation', shop_comment: '' }
  const eventStore = useEventStore(event.event_id) as EventStore
  await eventStore.updateEvent(event)
  window.alert(`「${event.shop_name}」に予約申請しました。店舗からの予約承認をお待ちください。`)
  emits('updated', event.event_id)
}

const stepperItems = computed(() => [
  {
    title: '場所・日時',
  },
  {
    title: '店舗選択',
  },
  {
    title: 'メニュー',
  },
  {
    title: 'イベント詳細',
  },
  {
    title: '店舗への連絡事項',
  },
])
</script>

<template>
  <v-stepper v-if="event" v-model="stepper" :items="stepperItems" hide-actions>
    <template #[`item.1`]>
      <v-form v-model="isValid1">
        <v-row class="justify-center">
          <v-col cols="12" sm="12" md="9">
            <event-basic-info-card v-model="event">
              <v-card-text class="text-center mt-10">
                <v-btn
                  color="primary"
                  class="me-3 mt-3"
                  size="large"
                  :append-icon="mdiChevronRight"
                  :disabled="!isValid1"
                  @click="stepper++"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
              </v-card-text>
            </event-basic-info-card>
          </v-col>
        </v-row>
      </v-form>
    </template>
    <template #[`item.2`]>
      <event-shop
        v-model="event"
        :shops="shops ?? []"
        :loading="shops == null"
        :is-updated-start-time="isUpdatedStartTime"
        @submit="stepper++"
        @next="stepper++"
        @back="stepper--"
      />
    </template>
    <template #[`item.3`]>
      <event-menu
        :menus="menus"
        :event="event"
        :shop="selectedShop"
        :loading="isLoadingMenu"
        @submit="stepper++"
        @back="stepper--"
      />
    </template>
    <template #[`item.4`]>
      <v-form v-model="isValid4">
        <v-row class="justify-center">
          <v-col cols="12" sm="12" md="9">
            <event-detail-card
              v-model="event"
              v-model:cover-image="coverImage"
              :subdomain-tags="communityStore.community?.subdomain_tags"
            >
              <v-card-text class="text-center mt-10">
                <v-btn color="primary" class="me-3 mt-3" size="large" :prepend-icon="mdiChevronLeft" @click="stepper--">
                  {{ $t('event_edit.back') }}
                </v-btn>
                <v-btn
                  color="primary"
                  class="me-3 mt-3"
                  size="large"
                  :append-icon="mdiChevronRight"
                  :disabled="!isValid4"
                  @click="stepper++"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
              </v-card-text>
            </event-detail-card>
          </v-col>
        </v-row>
      </v-form>
    </template>
    <template #[`item.5`]>
      <event-shop-notice
        v-model="event"
        v-model:shop="selectedShop"
        @submit="submit"
        @send-reserve-mail="sendReserveMail"
        @back="stepper--"
      />
    </template>
  </v-stepper>
  <confirm-dialog v-model="isOpenContactDialogVisible" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
</template>

<style lang="scss" scoped></style>
