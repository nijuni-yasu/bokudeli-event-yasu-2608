<script setup lang="ts">
import EventBasicInfo from '@/components/eventcreate/EventBasicInfo.vue'
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
import { useEventsStore, useEventStore, type EventsStore, type EventStore } from '@/stores/event'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useRouter, useRoute } from 'vue-router'
import { getEventPath, getCommunityPath } from '@/router/utils'
import { calculateDistance, fetchLocationByPostalcode } from '@/composable/fetchLocation'
import { maxBy } from 'lodash'
import { useValidators } from '@/composable/validators'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  communityId: string
}>()

const { postalCodeValidator } = useValidators()

const eventId = ref(route.query.id as string | null)

const isValid4 = ref(false)

const eventsStore = useEventsStore() as EventsStore
const communityStore = useCommunityStore(props.communityId) as CommunityStore

const isOpenContactDialogVisible = ref(true)

const event = computed<BokudeliEvent | null>({
  get: () => {
    if (eventId.value != null) {
      const eventStore = useEventStore(eventId.value) as EventStore
      return eventStore.event
    } else {
      return eventsStore.eventDraft
    }
  },
  set: (value) => {
    if (value == null) {
      return
    }
    if (eventId.value != null) {
      const eventStore = useEventStore(eventId.value) as EventStore
      eventStore.event = value
    } else {
      eventsStore.eventDraft = value
    }
  },
})
const shops = ref<Shop[]>([])
const menus = ref<PartnerMenu[]>([])
const coverImage = ref<File | null>(null)

// @ts-expect-error parseInt can take no string params, then return NaN
const stepQuery = Number.parseInt(route.query.step)
const stepper = ref(Number.isNaN(stepQuery) ? 1 : stepQuery)

const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)

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
        return doc.data() as Shop
      })
      .filter((shop) => {
        // check distance
        const shopLocation = {
          longitude: shop.shop_address_longitude,
          latitude: shop.shop_address_latitude,
        }
        const distance = calculateDistance(location, shopLocation)
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
      router.push(getCommunityPath(props.communityId))
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const roles = await communityStore.getCurrentUserRoles()
  if (roles == null || !roles.includes('manager')) {
    window.alert('コミュニティ運営者ではありません')
    router.push(getCommunityPath(props.communityId))
  }
})

onUnmounted(() => {
  if (eventId.value != null) {
    const eventStore = useEventStore(eventId.value) as EventStore
    eventStore.$reset()
  } else {
    eventsStore.$reset()
  }
})

const saveDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  if (eventId.value == null) {
    // 新規作成
    event.value.community_id = communityId
    const newEvent = await eventsStore.createNewEventFromDraft(communityId)
    const eventStore = useEventStore(newEvent.event_id) as EventStore
    if (coverImage.value != null) {
      await eventStore.updateCoverImage(coverImage.value)
    }
    eventsStore.eventDraft = new BokudeliEvent()
    // 現在の仕様だと直後にページ遷移するので、eventId を更新する必要はないが、今後のために残しておく
    eventId.value = newEvent.event_id
    return newEvent
  } else {
    // 更新
    const eventStore = useEventStore(eventId.value) as EventStore
    await eventStore.updateEvent(event.value)
    if (coverImage.value != null) {
      await eventStore.updateCoverImage(coverImage.value)
    }
    return event.value
  }
}

const sumbmit = async () => {
  const event = await saveDraft()
  if (event?.event_id == null || event?.community_account == null) {
    console.warn('Coud not save event')
    return
  }
  if (route.query.id == null) {
    window.alert(`「${event.event_name}」のイベントを新規作成しました`)
  } else {
    window.alert(`「${event.event_name} 」のイベントを更新しました`)
  }
  router.push(getEventPath(event.community_account, event.event_id))
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
  router.push(getEventPath(event.community_account, event.event_id))
}

const stepperItems = computed(() => [
  {
    title: '基本情報',
  },
  {
    title: 'お店',
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
      <event-basic-info v-model="event" @submit="stepper++" />
    </template>
    <template #[`item.2`]>
      <event-shop
        v-model="event"
        :shops="shops"
        :loading="isLoadingShop"
        @submit="stepper++"
        @next="stepper++"
        @back="stepper--"
      />
    </template>
    <template #[`item.3`]>
      <event-menu :menus="menus" :loading="isLoadingMenu" @submit="stepper++" @back="stepper--" />
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
                  前へ
                </v-btn>
                <v-btn
                  color="primary"
                  class="me-3 mt-3"
                  size="large"
                  :append-icon="mdiChevronRight"
                  :disabled="!isValid4"
                  @click="stepper++"
                >
                  次へ
                </v-btn>
              </v-card-text>
            </event-detail-card>
          </v-col>
        </v-row>
      </v-form>
    </template>
    <template #[`item.5`]>
      <event-shop-notice v-model="event" @submit="sumbmit" @send-reserve-mail="sendReserveMail" @back="stepper--" />
    </template>
    <div>
      <confirm-dialog v-model="isOpenContactDialogVisible" :ok-text="'OK'" max-width="800px">
        <v-card-text class="text-center py-10 text-h6"> イベントの作成・編集について </v-card-text>
        <v-card-text class="text-subtitle pb-0" style="line-height: 1.5rem">
          ・「開催場所」「開催日時」を入力後、対応可能な店舗を選択してイベント内容や注文情報を入力してください。<br />
          ・下書き保存をし、プレビューの確認後、店舗に予約申請をしてください。<br />
          ・店舗から予約申請の承認を受けたら、注文を開始することができます。<br />
          ・店舗から予約申請が却下された場合、店舗や日時などを変更して再度予約申請をしてください。<br />
          <br />
          ・予約申請後、「店舗」「開催場所」「開催日時」などの変更はできません。<br />
          ・予約申請後、「イベントタイトル」「イベント詳細」「イベント画像」の編集は可能です。<br />
          <br />
          ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> をご確認ください。<br />
          ・ご不明点ありましたらサポートまで
          <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />
        </v-card-text>
      </confirm-dialog>
    </div>
  </v-stepper>
</template>

<style lang="scss" scoped></style>
