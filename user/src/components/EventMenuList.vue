<script setup lang="ts">
import { db } from '@/firebase'
import { convertDocumentDataToMenu, dateString } from '@/schemes/converter'
import PartnerMenu from '@/schemes/partnerMenu'
import { collection, connectFirestoreEmulator, getDocs } from 'firebase/firestore'
import { parseISO, compareDesc } from 'date-fns'

const props = defineProps<{
  partnerId: string
  eventDeadline: Date | null
  eventStartDatetime: Date | null
  currentMemberCount: number | undefined
  eventMaxPeople: number
}>()

const emit = defineEmits<{
  (e: 'selectMenu', menu: PartnerMenu): void
  (e: 'setAlert', message: string): void
}>()

const state = reactive({
  menus: [] as PartnerMenu[],
  menuDisable: false as false | 'deadline' | 'limitPeople' | 'isSoldout',
  isLoading: true,
})

const partnerDb = collection(db, 'partners')
const loadMenuData = async (partnerId: string) => {
  const menuSnapshot = await getDocs(collection(partnerDb, partnerId, 'menus'))
  const menus = menuSnapshot.docs.map((doc) => convertDocumentDataToMenu(partnerId, doc.id, doc.data()))

  // 期間限定メニューをフィルタリング
  const withinDateMenus = menus.filter(menu => {
    // 期間設定がない場合はreturn
    if (!menu.dateStart || !menu.dateEnd){
      return true
      // 期間設定がある場合、イベントの日付と比較
    } else {
        const eventStartDate = parseISO(dateString(props.eventStartDatetime))
        const dateStart = parseISO(menu.dateStart)
        const dateEnd = parseISO(menu.dateEnd)
        return compareDesc(dateStart, eventStartDate) >= 0 && compareDesc(eventStartDate, dateEnd) >= 0
      }
  })
  withinDateMenus.sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))

  return withinDateMenus
}

const fetchData = async () => {
  state.menus = await loadMenuData(props.partnerId)
  state.isLoading = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.eventId !== from.params.eventId) {
    await fetchData()
  }
  next()
})

onMounted(async () => {
  await fetchData()
})

if (props.eventDeadline && props.eventDeadline < new Date()) {
  state.menuDisable = 'deadline'
} else if (props.currentMemberCount && props.currentMemberCount >= props.eventMaxPeople) {
  state.menuDisable = 'limitPeople'
} else {
  state.menuDisable = false
}

const selectMenu = (menu: PartnerMenu) => {
  emit('selectMenu', menu)
}

const alertMessage = ref('')
const alertBody = computed({
  get() {
    return alertMessage.value
  },
  set(val) {
    alertMessage.value = val
    emit('setAlert', val)
  },
})

const showDisableAlert = (reason: 'deadline' | 'limitPeople' | 'isSoldout') => {
  switch (reason) {
    case 'deadline':
      alertBody.value = '注文期限をすぎました。カートに追加できません'
      break
    case 'limitPeople':
      alertBody.value = '定員に達しました。カートに追加できません'
      break
    case 'isSoldout':
      alertBody.value = '売り切れました。カートに追加できません'
      break
  }
}
</script>
<template>
  <section>
    <v-row v-if="!state.isLoading && props.currentMemberCount !== undefined">
      <v-col v-for="menu in state.menus" :key="menu.id" md="4" sm="6" cols="12">
        <v-card class="mb-3 mx-0" color="text-center">
          <v-img :src="menu.imageUrl" aspect-ratio="1" cover />

          <!-- title -->
          <v-card-title class="justify-center pb-3 pre-line">
            {{ menu.name }}
          </v-card-title>
          <v-card-text class="text-left pb-8">
            {{ menu.description }}
          </v-card-text>
          <v-card-text class="text-right text-h6 pb-2"> ¥ {{ menu.price }} </v-card-text>
          <v-row v-if="state.menuDisable === false && menu.isSoldout === false" class="justify-center">
            <v-col class="text-center">
              <v-btn
                class="`px-5 my-4"
                color="primary"
                rounded
                width="80%"
                @click="selectMenu(menu)"
              >
                カートに追加
              </v-btn>
            </v-col>
          </v-row>
          <v-row v-else-if="state.menuDisable === false && menu.isSoldout === true" class="justify-center">
            <v-col class="text-center">
              <v-btn
                class="px-5 my-4 disable-menu-button"
                color="error"
                rounded
                width="80%"
                @click="showDisableAlert('isSoldout')"
              >
                売り切れ
              </v-btn>
            </v-col>
          </v-row>
          <v-row v-else-if="state.menuDisable" class="justify-center">
            <v-col class="text-center">
              <v-btn
                class="px-5 my-4 disable-menu-button"
                color="primary"
                rounded
                width="80%"
                @click="showDisableAlert(state.menuDisable)"
              >
                カートに追加
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- no result found -->
      <v-col v-show="!state.menus.length" cols="12" class="text-center">
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
