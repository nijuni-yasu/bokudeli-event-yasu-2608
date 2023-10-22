<script setup lang="ts">
import EventBasicInfo from '@/components/eventcreate/EventBasicInfo.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventDetail from '@/components/eventcreate/EventDetail.vue'
import EventShopNotice from '@/components/eventcreate/EventShopNotice.vue'
import { collection, collectionGroup, getDocs, query, where, addDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { convertDocumentDataToCommunity, convertDocumentDataToMenu } from '@/schemes/converter'
import BokudeliEvent, { createEmptyEvent } from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'
import PartnerMenu from '@/schemes/partnerMenu'
import { BasicInfo, ShopNotice, EventDetailData } from '@/schemes/eventCreate'
import { useRouter } from 'vue-router'
import { getEventPath } from '@/router/utils'

const router = useRouter()

type panelType = 'address' | 'shop' | 'menu' | 'info' | 'shopNotice'

const props = defineProps<{
  communityId: string
}>()

const state = reactive({
  event: {} as Partial<BokudeliEvent>,
  shops: [] as Shop[],
  menus: [] as PartnerMenu[],
})

const panel = ref(['address'] as panelType[])

const basicInfo = reactive<BasicInfo>({
  title: '',
  postcode: '',
  address: '',
  placeName: '',
  placeUrl: '',
  startDateTime: null,
  endDateTime: null,
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

const fetchShops = async () => {
  isLoadingShop.value = true

  const shopDb = collectionGroup(db, 'shops')
  const shopSnapshot = await getDocs(shopDb)
  const shops = shopSnapshot.docs.map((doc) => {
    return doc.data() as Shop
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

const submittedBasicInfo = async (info: BasicInfo) => {
  state.event.event_name = info.title
  state.event.event_address = info.address
  state.event.event_start_datetime = info.startDateTime ? Timestamp.fromDate(info.startDateTime) : null
  state.event.event_end_datetime = info.endDateTime ? Timestamp.fromDate(info.endDateTime) : null

  //TODO: 以下の項目について確認する
  // postcode: string
  // placeName: string
  // placeUrl: string

  await fetchShops()
  if (!panel.value.find((v) => v === 'shop')) {
    panel.value.push('shop')
  }
}

const submittedShop = async (shop: Shop) => {
  state.event.shop_id = shop.shop_id
  state.event.partner_id = shop.partner_id
  state.event.shop_name = shop.shop_name

  await fetchMenu()
  if (!panel.value.find((v) => v === 'menu')) {
    panel.value.push('menu')
  }
}

const submittedMenu = () => {
  if (!panel.value.find((v) => v === 'info')) {
    panel.value.push('info')
  }
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

  if (!panel.value.find((v) => v === 'shopNotice')) {
    panel.value.push('shopNotice')
  }
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
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
  }

  if (eventItem.community_id && eventItem.community_account) {
    const addedDoc = await addDoc(collection(db, 'communities', eventItem.community_id, 'events'), eventItem)
    // 自動採番されたOrderIDを取得して項目として追加追加
    await setDoc(addedDoc, { event_id: addedDoc.id }, { merge: true })
    window.alert(`イベントID： ${addedDoc.id} のイベントを新規作成しました`)
    router.push(getEventPath(eventItem.community_account, addedDoc.id))
  }
}
</script>

<template>
  <v-card>
    <v-expansion-panels v-model="panel" multiple>
      <v-expansion-panel value="address">
        <v-expansion-panel-title>基本情報</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-basic-info v-model="basicInfo" @submit="submittedBasicInfo" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="shop">
        <v-expansion-panel-title>お店</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-shop :shops="state.shops" :loading="isLoadingShop" @submit="submittedShop" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="menu">
        <v-expansion-panel-title>メニュー</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-menu :menus="state.menus" :loading="isLoadingMenu" @submit="submittedMenu" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="info">
        <v-expansion-panel-title>イベント詳細</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-detail v-model="eventDetailData" @submit="submittedDetail" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="shopNotice">
        <v-expansion-panel-title>店舗への連絡事項</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-shop-notice v-model="shopNotice" @submit="submitShopNotice" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<style lang="scss" scoped></style>
