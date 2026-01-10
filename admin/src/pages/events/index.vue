<script setup lang="ts">
import { where, orderBy } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { usePartnerStore, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { useEventListStore } from '@shokujii/base/stores/eventList.js'
import { getCommunityPath, getShopPath } from '@/navigation/utils'
import EventCard from '@shokujii/base/components/EventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'
import { mdiPencilBoxOutline } from '@mdi/js'

const router = useRouter()
const { t: $t } = useI18n()
const display = useDisplay()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)

const shop = await new Promise<BokudeliPartnerShop | null>((resolve) => {
  watch(
    () => partnerStore.shops,
    (shops) => {
      if (shops != null) {
        if (shops.length === 0) {
          resolve(null)
        } else {
          resolve(shops[0])
        }
        stop()
      }
    },
    { immediate: true },
  )
})

if (shop == null) {
  window.alert($t('alert.make_shop'))
  router.push(getShopPath())
} else if (shop.community_account == null) {
  window.alert($t('alert.make_community_account'))
  router.push(getCommunityPath())
}

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    case 'md':
      return 3
    default:
      return 4
  }
})

// ページ遷移すると query 持ちのリクエストが失敗するので filter に null, count に 0 を渡す
// TODO 原因調査
const eventListStore = useEventListStore(
  shop == null
    ? null
    : [where('community_account', '==', shop.community_account), orderBy('event_start_datetime', 'desc')],
  shop == null ? 0 : numOfColumns.value,
)

const events = computed(
  () =>
    eventListStore.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      } else {
        return { event: s.event, members: s.members ?? [] }
      }
    }) ?? [],
)

const fab = () => {
  router.push('/events/create')
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="12" class="px-0">
      <v-row>
        <v-col v-for="({ event, members }, i) of events" :key="`item_${i}`" cols="12" sm="6" md="4" lg="3">
          <router-link v-if="event != null" :to="{ path: '/events/create', query: { id: event.event_id } }">
            <EventCard class="event-card" :event="event" :members="members" />
          </router-link>
        </v-col>
      </v-row>
      <v-row v-show="events.length ?? 0 !== 0">
        <v-col cols="12" class="text-center">
          <IncrementalLoader
            class="my-5"
            :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
            :loaded-count="eventListStore.eventStores?.length ?? 0"
            @load="eventListStore.next()"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
  <v-btn class="fab" size="x-large" elevation="12" :prepend-icon="mdiPencilBoxOutline" @click="fab">{{
    $t('event.new')
  }}</v-btn>
</template>

<style scoped lang="scss">
.event-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
}

.fab {
  position: fixed;
  bottom: 80px;
  right: 30px;
}
</style>
