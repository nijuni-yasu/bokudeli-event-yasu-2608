<script setup lang="ts">
import EventAddress from '@/components/eventcreate/EventAddress.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventInfo from '@/components/eventcreate/EventInfo.vue'
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { convertDocumentDataToCommunity, convertDocumentDataToMenu } from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'
import PartnerMenu from '@/schemes/partnerMenu'

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

const address = ref('')
const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)

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

  const { partnerId } = state.event
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
  state.event.eventAddress = address.value
  await fetchShops()
  if (!panel.value.find((v) => v === 'shop')) {
    panel.value.push('shop')
  }
}

const submittedShop = async (shop: Shop) => {
  state.event.shopId = shop.shop_id
  state.event.partnerId = shop.partner_id
  state.event.shopName = shop.shop_name

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

const submit = (savedEvent: Partial<BokudeliEvent>) => {
  console.log(savedEvent)
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
          <event-menu :menus="state.menus" :loading="isLoadingMenu" @submit="submittedMenu" />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="info">
        <v-expansion-panel-title>イベント情報</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-info :event="state.event" @submit="submit" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<style lang="scss" scoped></style>
