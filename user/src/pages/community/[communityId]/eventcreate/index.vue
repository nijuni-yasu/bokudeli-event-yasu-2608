<script setup lang="ts">
import EventAddress from '@/components/eventcreate/EventAddress.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventInfo from '@/components/eventcreate/EventInfo.vue'
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'

type panelType = 'address' | 'shop' | 'menu' | 'info'

const props = defineProps<{
  communityId: string
}>()

const state = reactive({
  event: {} as Partial<BokudeliEvent>,
  shops: [] as Shop[],
})

const panel = ref(['address'] as panelType[])

const address = ref('')
const isLoadingShop = ref(true)

const eventSettingsData = {
  information: {
    postcode: '101-0022',
    address: '東京都千代田区神田練塀町3 富士ソフト秋葉原ビル12F',
    shop: '天正',
    date: '2023-02-02',
    time: '15:30',
    title: '第30回 ぼくデリ会',
    description:
      'The name’s John Deo. I am a tireless seeker of knowledge, occasional purveyor of wisdom and also, coincidentally, a graphic designer. Algolia helps businesses across industries quickly create relevant 😎, scaLabel 😀, and lightning 😍 fast search and discovery experiences.',
    community: 'DMM.make AKIBA',
  },
}

const fetchData = async () => {
  const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))
  const communitySnapshot = await getDocs(communityDb)
  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const { communityId, communityName, communityAccount } = convertDocumentDataToCommunity(communityData)
    state.event = {
      communityId,
      communityAccount,
      communityName,
    }
  }
}

const fetchShops = async () => {
  const shopDb = collectionGroup(db, 'shops')
  const shopSnapshot = await getDocs(shopDb)
  const shops = shopSnapshot.docs.map((doc) => {
    return doc.data() as Shop
  })
  state.shops = shops
  isLoadingShop.value = false
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

const submittedAddress = () => {
  state.event.eventAddress = address.value
  fetchShops()
  if (!panel.value.find((v) => v === 'shop')) {
    panel.value.push('shop')
  }
}

const submittedShop = (shop: Shop) => {
  state.event.shopId = shop.shop_id
  if (!panel.value.find((v) => v === 'menu')) {
    panel.value.push('menu')
  }
}
</script>

<template>
  <v-card>
    <v-expansion-panels v-model="panel" multiple>
      <v-expansion-panel value="address">
        <v-expansion-panel-title>郵便番号</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-address v-model="address" @submit="submittedAddress" />
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
          <event-menu :information-data="eventSettingsData.information"></event-menu>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="info">
        <v-expansion-panel-title>イベント情報</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-info :information-data="eventSettingsData.information"></event-info>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<style lang="scss" scoped></style>
