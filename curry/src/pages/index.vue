<script setup lang="ts">
import topLogo from '@/assets/images/curry/curry_logo_cover.png'
import { getEventPath } from '@/router/utils'
import { useEventListStore } from '@shokujii/base/stores/eventList.js'
import { where, orderBy } from 'firebase/firestore'
import EventCard from '@shokujii/base/components/EventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    default:
      return 3
  }
})

const eventListStore = useEventListStore(
  [
    where('is_public', '==', true),
    where('event_status.value', '==', 'accepting_order'),
    where('subdomain_tags', 'array-contains', 'kanda-curry'),
    orderBy('event_start_datetime', 'desc'),
  ],
  numOfColumns.value,
)

const events = computed(
  () =>
    eventListStore.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }) ?? [],
)
</script>

<template>
  <v-row class="justify-center align-center">
    <v-col md="10" cols="12">
      <a href="https://kanda-curry.com/" target="_blank">
        <v-card class="d-flex align-center justify-center text-center mb-5" flat>
          <v-img :src="topLogo" />
        </v-card>
      </a>
      <v-row class="mb-2">
        <!-- cols 等を修正した場合は numOfColumns も修正する必要あり -->
        <v-col v-for="{ event, members } in events" :key="event.event_id" md="4" sm="6" cols="12" class="content">
          <router-link :to="getEventPath(event.community_account, event.event_id)">
            <EventCard class="event-card" :event="event" :members="members" />
          </router-link>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="text-center">
          <IncrementalLoader
            :total-count="eventListStore.totalCount ?? 0"
            :loaded-count="eventListStore.eventStores?.length ?? 0"
            @load="eventListStore.next()"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>
.event-card {
  height: 100%;
  width: 100%;
}
</style>
