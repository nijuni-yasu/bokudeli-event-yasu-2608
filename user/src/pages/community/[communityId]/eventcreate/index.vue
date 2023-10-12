<script setup lang="ts">
import EventBasicInfo from '@/components/eventcreate/EventBasicInfo.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventDetail from '@/components/eventcreate/EventDetail.vue'
import EventShopNotice from '@/components/eventcreate/EventShopNotice.vue'
import { collection, collectionGroup, getDocs, query, where, addDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { convertDocumentDataToCommunity, convertDocumentDataToMenu } from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'
import PartnerMenu from '@/schemes/partnerMenu'
import { BasicInfo } from '@/schemes/eventCreate'
import { useRouter } from 'vue-router'
import { getEventPath } from '@/router/utils'

type panelType = 'address' | 'shop' | 'menu' | 'info'

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
  startDateTime: null,
  endDateTime: null,
})
const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)

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

  const { partner_id: partnerId } = state.event
  if (!partnerId) {
    isLoadingMenu.value = false
    return
  }
  const partnerDb = collection(db, 'partners')

  const menuSnapshot = await getDocs(collection(partnerDb, partnerId, 'menus'))

  const menus = menuSnapshot.docs
    .map((doc) => convertDocumentDataToMenu(partnerId, doc.id, doc.data()))
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

const submittedAddress = async () => {
  // state.event.eventAddress = address.value
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

const router = useRouter()
const submit = async (savedEvent: Partial<BokudeliEvent>) => {
  console.log(savedEvent)
  const eventItem = {
    community_id: savedEvent.community_id,
    community_account: savedEvent.community_account,
    community_name: savedEvent.community_name,
    event_name: '',
    event_desc: '',
    event_cover_url: '',
    event_address: '',
    event_deadline_datetime: Timestamp.now(),
    event_start_datetime: Timestamp.now(),
    event_end_datetime: Timestamp.now(),
    event_max_people: 20,
    event_payment: 'user_advance',
    shop_name: savedEvent.shop_name,
    shop_id: savedEvent.shop_id,
    partner_id: savedEvent.partner_id,
    is_public: false,
    // user_id: '',
    // user_name: '',
    // orgnizer_fullname: '',
    // orgnizer_company: '',
    // orgnizer_email: '',
    // orgnizer_phone_personal: '',
    // orgnizer_phone_company: '',
    // orgnizer_note_delivery: '',
    // orgnizer_note_event: '',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  }

  if (savedEvent.community_id && savedEvent.community_account) {
    const addedDoc = await addDoc(collection(db, 'communities', savedEvent.community_id, 'events'), eventItem)
    // 自動採番されたOrderIDを取得して項目として追加追加
    await setDoc(addedDoc, { event_id: addedDoc.id }, { merge: true })
    window.alert(`イベントID： ${addedDoc.id} のイベントを新規作成しました`)
    router.push(getEventPath(savedEvent.community_account, addedDoc.id))
  }
}
</script>

<template>
  <v-card>
    <v-expansion-panels v-model="panel" multiple>
      <v-expansion-panel value="address">
        <v-expansion-panel-title>基本情報</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-basic-info v-model="basicInfo" @submit="submittedAddress" />
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
          <event-detail :event="state.event" @submit="submit" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="shopNotice">
        <v-expansion-panel-title>店舗への連絡事項</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-shop-notice :event="state.event" @submit="submit" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<style lang="scss" scoped></style>
