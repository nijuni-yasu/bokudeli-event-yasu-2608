<script setup lang="ts">
import { where, orderBy } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { usePartnerStore } from '@/stores/partner'
import { useEventsStore, type EventsStore } from '@/stores/event'
import { getCommunityPath, getShopPath } from '@/navigation/utils'
import type { Shop } from '@/schemes/shop'
import EventCard from '@/components/EventCard.vue'
import { mdiPlus } from '@mdi/js'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'

const router = useRouter()
const { t: $t } = useI18n()
const display = useDisplay()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)

const shop = await new Promise<Shop | null>((resolve) => {
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
  throw new Error()
} else if (shop.community_account == null) {
  window.alert($t('alert.make_community_account'))
  router.push(getCommunityPath())
  throw new Error()
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

const eventsStore = useEventsStore(
  [where('community_account', '==', shop.community_account), orderBy('event_start_datetime', 'desc')],
  numOfColumns.value,
) as EventsStore

const events = computed(
  () =>
    eventsStore.eventStores?.flatMap((s) => {
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
    <v-col cols="12" sm="12" md="9" class="px-0">
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
            :total-count="eventsStore.totalCount ?? 0"
            :loaded-count="eventsStore.eventStores?.length ?? 0"
            @load="eventsStore.next()"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
  <v-fab size="large" :icon="mdiPlus" @click="fab" />
</template>

<style scoped lang="scss">
.event-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
}

.v-fab {
  position: fixed;
  bottom: 80px;
  right: 80px;
}
</style>
