<script setup lang="ts">
import EventBasicInfo from '@/components/eventcreate/EventBasicInfo.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventDetail from '@/components/eventcreate/EventDetail.vue'
import EventShopNotice from '@/components/eventcreate/EventShopNotice.vue'
import { collection, collectionGroup, getDocs, query, where, addDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import {
  convertDocumentDataToCommunity,
  convertDocumentDataToMenu,
  convertDateToWeekTimestamp,
  convertShopTimeToWeekTimestamp,
} from '@/schemes/converter'
import BokudeliEvent, { createEmptyEvent } from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'
import PartnerMenu from '@/schemes/partnerMenu'
import { BasicInfo, ShopNotice, EventDetailData } from '@/schemes/eventCreate'
import { useRouter } from 'vue-router'
import { getEventPath } from '@/router/utils'
import { uploadEventImage } from '@/composable/uploadImage'
import { LatLogLocation, calculateDistance } from '@/composable/fetchLocation'
import { maxBy } from 'lodash'

const router = useRouter()

const props = defineProps<{
  communityId: string
}>()

const state = reactive({
  event: {} as Partial<BokudeliEvent>,
  shops: [] as Shop[],
  menus: [] as PartnerMenu[],
  coverImage: null as File | null,
})

const stepper = ref(1)

const basicInfo = reactive<BasicInfo>({
  title: '',
  postalcode: '',
  address: '',
  placeName: '',
  placeUrl: '',
  startDateTime: null,
  endDateTime: null,
  location: null,
})
const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)
const eventDetailData = reactive<EventDetailData>({
  eventCoverUrl: '',
  eventDesc: '',
  eventDeadlineDateTime: null,
  eventMaxPeople: 0,
  isPublic: false,
  eventPayment: 'user_advance',
  eventCoverImage: null,
})

const shopNotice = reactive<ShopNotice>({
  organizerFullName: '',
  organizerCompany: '',
  organizerPhonePersonal: '',
  organizerPhoneCompany: '',
  organizerEmail: '',
  organizerMemo: '',
})

const fetchData = async () => {
  const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))
  const communitySnapshot = await getDocs(communityDb)
  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const { communityId, communityName, communityAccount } = convertDocumentDataToCommunity(communityData)
    state.event = {
      community_id: communityId,
      community_account: communityAccount,
      community_name: communityName,
    }
  }
}

const fetchShops = async (eventLocation: LatLogLocation, startDateTime: Date) => {
  isLoadingShop.value = true

  const shopDb = collectionGroup(db, 'shops')
  const shopSnapshot = await getDocs(shopDb)
  const shops = shopSnapshot.docs
    .map((doc) => {
      return doc.data() as Shop
    })
    .filter((shop) => {
      // check distance
      const shopLocation = {
        longitude: shop.shop_address_longitude,
        latitude: shop.shop_address_latitude,
      }
      const distance = calculateDistance(eventLocation, shopLocation)
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
  state.shops = shops
  isLoadingShop.value = false
}

const fetchMenu = async () => {
  isLoadingMenu.value = true

  const { partner_id } = state.event
  if (!partner_id) {
    isLoadingMenu.value = false
    return
  }
  const partnerDb = collection(db, 'partners')

  const menuSnapshot = await getDocs(collection(partnerDb, partner_id, 'menus'))

  const menus = menuSnapshot.docs
    .map((doc) => convertDocumentDataToMenu(partner_id, doc.id, doc.data()))
    .sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))

  state.menus = menus
  isLoadingMenu.value = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.communityId !== from.params.communityId) {
    await fetchData()
  }
  next()
})

onMounted(async () => {
  await fetchData()
})

// TODO:このバリデーションの関数、効いていないので後で対応
const basicInfoValidation = computed(() => {
  if (basicInfo.location && basicInfo.startDateTime != null && basicInfo.endDateTime != null) {
    // Invalid Date を判定するために getTime() の NaN をチェックする
    const startDateTime = basicInfo.startDateTime.getTime()
    const endDateTime = basicInfo.endDateTime.getTime()
    if (!Number.isNaN(startDateTime) && !Number.isNaN(endDateTime) && startDateTime < endDateTime) {
      return true
    }
  }
  return false
})

const submittedBasicInfo = async () => {
  state.event.event_name = basicInfo.title
  state.event.event_postalcode = basicInfo.postalcode
  state.event.event_address = basicInfo.address
  state.event.event_place = basicInfo.placeName
  state.event.event_place_url = basicInfo.placeUrl
  state.event.event_start_datetime = basicInfo.startDateTime ? Timestamp.fromDate(basicInfo.startDateTime) : null
  state.event.event_end_datetime = basicInfo.endDateTime ? Timestamp.fromDate(basicInfo.endDateTime) : null

  await fetchShops(basicInfo.location as LatLogLocation, basicInfo.startDateTime as Date)
  // NEXT ボタンを使用する場合はいらない
  stepper.value++
}

const submittedShop = async (shop: Shop) => {
  state.event.shop_id = shop.shop_id
  state.event.partner_id = shop.partner_id
  state.event.shop_name = shop.shop_name

  await fetchMenu()
  stepper.value++
}

const submittedMenu = () => {
  stepper.value++
}

const submittedDetail = (detail: EventDetailData) => {
  state.event.event_cover_url = detail.eventCoverUrl
  state.event.event_desc = detail.eventDesc
  state.event.event_deadline_datetime = detail.eventDeadlineDateTime
    ? Timestamp.fromDate(detail.eventDeadlineDateTime)
    : null
  state.event.event_max_people = detail.eventMaxPeople
  state.event.is_public = detail.isPublic
  state.event.event_payment = detail.eventPayment
  state.coverImage = detail.eventCoverImage

  stepper.value++
}

const submitShopNotice = async (shopNotice: ShopNotice) => {
  state.event.organizer_fullname = shopNotice.organizerFullName
  state.event.organizer_company = shopNotice.organizerCompany
  state.event.organizer_phone_personal = shopNotice.organizerPhonePersonal
  state.event.organizer_phone_company = shopNotice.organizerPhoneCompany
  state.event.organizer_email = shopNotice.organizerEmail
  state.event.organizer_memo = shopNotice.organizerMemo

  await submit()
}
const submit = async () => {
  const eventItem = {
    ...createEmptyEvent(),
    ...state.event,
    ...{
      event_status: 'in_draft',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  }

  if (eventItem.community_id && eventItem.community_account) {
    const addedDoc = await addDoc(collection(db, 'communities', eventItem.community_id, 'events'), eventItem)
    // 自動採番されたOrderIDを取得して項目として追加追加
    const eventId = addedDoc.id
    const eventCoverUrl = state.coverImage
      ? await uploadEventImage(eventItem.community_id, eventId, state.coverImage)
      : ''
    await setDoc(addedDoc, { event_id: eventId, event_cover_url: eventCoverUrl }, { merge: true })

    window.alert(`イベントID： ${addedDoc.id} のイベントを新規作成しました`)
    router.push(getEventPath(eventItem.community_account, addedDoc.id))
  }
}

const backStepper = () => {
  stepper.value--
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
  <v-stepper v-model="stepper" :items="stepperItems" hide-actions>
    <template #[`item.1`]>
      <event-basic-info v-model="basicInfo" @submit="submittedBasicInfo" />
    </template>
    <template #[`item.2`]>
      <event-shop :shops="state.shops" :loading="isLoadingShop" @submit="submittedShop" @back="backStepper" />
    </template>
    <template #[`item.3`]>
      <event-menu :menus="state.menus" :loading="isLoadingMenu" @submit="submittedMenu" @back="backStepper" />
    </template>
    <template #[`item.4`]>
      <event-detail v-model="eventDetailData" @submit="submittedDetail" @back="backStepper" />
    </template>
    <template #[`item.5`]>
      <event-shop-notice v-model="shopNotice" @submit="submitShopNotice" @back="backStepper" />
    </template>
  </v-stepper>
</template>

<style lang="scss" scoped></style>
