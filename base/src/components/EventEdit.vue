<script setup lang="ts">
import EventBasicInfoCard from '@/components/eventcreate/EventBasicInfoCard.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventDetailCard from '@/components/eventcreate/EventDetailCard.vue'
import EventShopNotice from '@/components/eventcreate/EventShopNotice.vue'
import { collection, collectionGroup, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import {
  convertDocumentDataToMenu,
  convertDateToWeekTimestamp,
  convertShopTimeToWeekTimestamp,
} from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { type Shop } from '@/schemes/shop'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import { useEventStore, type EventStore } from '@/stores/event'
import { useEventListStore } from '@/stores/eventList'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useRouter } from 'vue-router'
import { getCommunityPath } from '@/router/utils'
import { calculateDistance, fetchLocationByPostalcode } from '@/composable/fetchLocation'
import { maxBy } from 'lodash'
import { useValidators } from '@/composable/validators'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
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

const eventListStore = useEventListStore()
const communityStore = useCommunityStore(props.communityAccount) as CommunityStore

const isOpenContactDialogVisible = ref(props.eventId == null)

const _event = ref<BokudeliEvent | null>(null)
const event = computed<BokudeliEvent | null>({
  get: () => {
    if (props.eventId != null) {
      const eventStore = useEventStore(props.eventId) as EventStore
      return eventStore.event
    } else {
      if (_event.value == null && communityStore.community != null) {
        _event.value = new BokudeliEvent(
          communityStore.community.community_id,
          communityStore.community.community_account,
          communityStore.community.community_name,
          communityStore.community.community_manager_fullname,
          communityStore.community.community_company,
          communityStore.community.community_email,
          communityStore.community.community_phone,
        )
      }
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
const shops = ref<Shop[]>([])
const menus = ref<PartnerMenu[]>([])
const coverImage = ref<File | null>(null)
const selectedShop = computed((): Shop | null => {
  if (event.value == null) {
    return null
  }
  return shops.value.find((shop) => shop.shop_id === event.value?.shop_id) ?? null
})

// 作成・更新のユーザーID取得
const userStore = useStoreStoredUser()
const handleUserId = userStore.storedUser?.userId ?? ''

// @ts-expect-error parseInt can take no string params, then return NaN
const stepQuery = Number.parseInt(props.step)
const stepper = ref(Number.isNaN(stepQuery) ? 1 : stepQuery)

const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)

const isUpdatedStartTime = ref(false)

// Fetch Shops
watch(
  [() => event.value?.event_start_datetime, () => event.value?.event_postalcode],
  async () => {
    if (event.value == null) {
      return
    }
    const startDateTime = event.value.event_start_datetime?.toDate()
    const postalcode = event.value.event_postalcode
    if (isEmpty(postalcode) || postalCodeValidator(postalcode) !== true) {
      return
    }
    const location = await fetchLocationByPostalcode(postalcode)
    if (location == null || startDateTime == null) {
      shops.value = []
      return
    }

    isLoadingShop.value = true

    const shopDb = collectionGroup(db, 'shops')
    const shopSnapshot = await getDocs(shopDb)
    shops.value = shopSnapshot.docs
      .map((doc) => {
        const shop = doc.data() as Shop

        // calculate distance
        const shopLocation = {
          longitude: shop.shop_address_longitude,
          latitude: shop.shop_address_latitude,
        }
        const distance = calculateDistance(location, shopLocation)
        // 最小注文個数の配列の何番目かを取得
        const rangeIndex = shop.shop_range_min_orders.findIndex(
          (order) => order?.range != null && order.range >= distance,
        )
        // 最小注文個数（注文の目安）を取得。値がない場合は30に設定
        const min_orders_on_spot = shop.shop_range_min_orders[rangeIndex]?.min_orders ?? 30
        return { ...shop, distance, min_orders_on_spot }
      })
      .filter((shop) => {
        // check distance
        const distance = shop.distance
        const maxRange = maxBy(shop.shop_range_min_orders, 'range')?.range
        const isInRange = maxRange ? distance <= maxRange : false

        // check time
        const eventTimeStart = convertDateToWeekTimestamp(startDateTime)
        const isInTime = shop.shop_time.some((shopTime, dayOfWeek) => {
          if (!shopTime.is_open) {
            return false
          }
          const timeStart = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_start)
          const timeEnd = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_end)
          const timeStart2 = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_start2)
          const timeEnd2 = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_end2)
          return (
            (timeStart <= eventTimeStart && eventTimeStart <= timeEnd) ||
            (timeStart2 <= eventTimeStart && eventTimeStart <= timeEnd2)
          )
        })

        return isInRange && isInTime && shop.is_approved && shop.is_open
      })
      .sort((a, b) => a.min_orders_on_spot - b.min_orders_on_spot)
    isLoadingShop.value = false
  },
  { immediate: true },
)

// Fetch Menus
watch(
  () => event.value?.partner_id,
  async () => {
    const partner_id = event.value?.partner_id
    if (!partner_id) {
      return
    }

    isLoadingMenu.value = true
    const partnerDb = collection(db, 'partners')

    const menuSnapshot = await getDocs(collection(partnerDb, partner_id, 'menus'))

    menus.value = menuSnapshot.docs
      .map((doc) => convertDocumentDataToMenu(partner_id, doc.id, doc.data()))
      .sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))

    isLoadingMenu.value = false
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
    if (!newStartDateTime.isEqual(oldStartDateTime)) {
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
  if (props.eventId == null) {
    // 新規作成
    event.value.community_id = communityId
    event.value.created_by = handleUserId
    event.value.updated_by = handleUserId
    const newEvent = await eventListStore.createNewEvent(event.value, coverImage.value)
    return newEvent
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
    console.warn("The event doesn't have enough information.", event)
    return
  }
  event.event_status = { value: 'applying_reservation' }
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
        :shops="shops"
        :loading="isLoadingShop"
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
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
</template>

<style lang="scss" scoped></style>
