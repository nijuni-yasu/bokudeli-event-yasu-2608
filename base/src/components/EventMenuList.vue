<script setup lang="ts">
import { db } from '@/firebase'
import { convertDocumentDataToMenu, dateString, priceString } from '@/schemes/converter'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { collection, getDocs } from 'firebase/firestore'
import { parseISO, compareDesc } from 'date-fns'

const props = defineProps<{
  event: BokudeliEvent
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'selectMenu', menu: PartnerMenu): void
}>()

const menus = ref<PartnerMenu[] | null>(null)
const isLoading = ref(true)

const eventStartDatetime = computed(() => {
  return props.event.event_start_datetime?.toDate() ?? null
})

const partnerDb = collection(db, 'partners')
const loadMenuData = async (partnerId: string) => {
  const menuSnapshot = await getDocs(collection(partnerDb, partnerId, 'menus'))
  const menus = menuSnapshot.docs.map((doc) => convertDocumentDataToMenu(partnerId, doc.id, doc.data()))

  // 期間限定メニューをフィルタリング
  const withinDateMenus = menus.filter((menu) => {
    // 期間設定がない場合はreturn
    if (!menu.dateStart || !menu.dateEnd) {
      return true
      // 期間設定がある場合、イベントの日付と比較
    } else {
      const eventStartDate = parseISO(dateString(eventStartDatetime.value))
      const dateStart = parseISO(menu.dateStart)
      const dateEnd = parseISO(menu.dateEnd)
      return compareDesc(dateStart, eventStartDate) >= 0 && compareDesc(eventStartDate, dateEnd) >= 0
    }
  })
  withinDateMenus.sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))

  return withinDateMenus
}

const fetchData = async () => {
  menus.value = await loadMenuData(props.event.partner_id)
  isLoading.value = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  await fetchData()
  next()
})

onMounted(async () => {
  await fetchData()
})
</script>
<template>
  <section>
    <v-row v-if="!isLoading && menus !== null">
      <v-col v-for="menu in menus" :key="menu.id" md="4" sm="6" cols="12" class="pa-3">
        <v-card class="mb-1" color="text-center">
          <v-img :src="menu.imageUrl" aspect-ratio="1" cover />

          <!-- title -->
          <v-card-title class="justify-center pb-3 pre-line">
            {{ menu.name }}
          </v-card-title>
          <v-card-text class="text-left pb-8">
            {{ menu.description }}
          </v-card-text>
          <v-card-text class="text-right pb-2">
            <span style="font-size: 14px; color: #3a3541de">¥ </span>
            <span style="font-size: 20px; color: #3a3541de">{{ priceString(menu.price) }}</span>
          </v-card-text>
          <v-row class="justify-center">
            <v-col class="text-center">
              <v-btn
                style="font-size: 16px"
                class="mt-2 mb-5"
                :class="{ 'disable-menu-button': disabled || menu.isSoldout === true }"
                color="primary"
                rounded
                elevation="5"
                prepend-icon="mdi-food-fork-drink"
                @click="emit('selectMenu', menu)"
              >
                {{ menu.isSoldout === true ? '売り切れ' : '注文して参加する' }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- no result found -->
      <v-col v-show="menus !== null && menus.length === 0" cols="12" class="text-center">
        <h4 class="mt-4">メニューがありません</h4>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </section>
</template>
<style lang="scss" scoped>
.disable-menu-button {
  opacity: 0.6;
}
</style>
