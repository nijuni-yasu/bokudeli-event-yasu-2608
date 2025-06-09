<script setup lang="ts">
import { getEventPath } from '@/router/utils'
import { useEventListStore } from '@/stores/eventList'
import TopCarousel from '@/components/TopCarousel.vue'
import { where, orderBy, Timestamp } from 'firebase/firestore'
import EventCard from '@/components/EventCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'
import { mdiCrownOutline, mdiCalendarHeart, mdiCalendarCheck } from '@mdi/js'

const display = useDisplay()

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    default:
      return 4
  }
})
const numOfPopularColumns = 4

const now = Timestamp.now()

const popularEventListStore = useEventListStore(
  [
    where('is_public', '==', true),
    where('event_status.value', '==', 'accepting_order'),
    where('event_deadline_datetime', '>', now),
    orderBy('event_num_members', 'desc'),
  ],
  numOfPopularColumns,
)

const popularEvents = computed(() => {
  const events =
    popularEventListStore.eventStores?.flatMap((s) => {
      if (s.event == null || s.event.event_num_members < 3) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }) ?? []
  if (
    events.length < numOfPopularColumns &&
    (popularEventListStore.totalCount ?? 0) > (popularEventListStore.eventStores?.length ?? 0)
  ) {
    popularEventListStore.next()
  }
  return events
})

const upcomingEventListStore = useEventListStore(
  [
    where('is_public', '==', true),
    where('event_status.value', '==', 'accepting_order'),
    where('event_end_datetime', '>', now),
    orderBy('event_start_datetime', 'asc'),
  ],
  numOfColumns.value,
)

const upcomingEvents =
  computed(() =>
    upcomingEventListStore.eventStores?.flatMap((s) => {
      if (s.event == null || s.event.event_num_members < 2) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }),
  ) ?? []

const pastEventListStore = useEventListStore(
  [
    where('is_public', '==', true),
    where('event_status.value', '==', 'accepting_order'),
    where('event_end_datetime', '<=', now),
    orderBy('event_start_datetime', 'desc'),
  ],
  numOfColumns.value,
)

const pastEvents =
  computed(() =>
    pastEventListStore.eventStores?.flatMap((s) => {
      if (s.event == null || s.event.event_num_members < 2) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }),
  ) ?? []

const next = () => {
  if ((upcomingEventListStore.eventStores?.length ?? 0) < (upcomingEventListStore.totalCount ?? Infinity)) {
    upcomingEventListStore.next()
  } else {
    pastEventListStore.next()
  }
}
</script>

<template>
  <v-row class="justify-center align-center">
    <v-col md="10" cols="12">
      <TopCarousel />
      <v-row class="mb-2">
        <template v-if="popularEvents.length > 0">
          <v-col cols="12" class="text-h4 mt-8 ml-2">
            <v-row align="center">
              <v-icon size="40" :icon="mdiCrownOutline" class="mr-1" />
              <span>{{ $t('top.popular_events') }}</span>
            </v-row>
          </v-col>
          <!-- cols 等を修正した場合は numOfColumns も修正する必要あり -->
          <v-col
            v-for="{ event, members } in popularEvents"
            :key="`popular_${event.event_id}`"
            md="3"
            sm="6"
            cols="12"
            class="content"
          >
            <router-link :to="getEventPath(event.community_account, event.event_id)">
              <EventCard class="event-card" :event="event" :members="members" />
            </router-link>
          </v-col>
        </template>
        <v-col cols="12" class="text-h4 mt-10 ml-2">
          <v-row align="center">
            <v-icon size="40" :icon="mdiCalendarHeart" class="mr-1" />
            <span>{{ $t('top.upcoming_events') }}</span>
          </v-row>
        </v-col>
        <!-- cols 等を修正した場合は numOfColumns も修正する必要あり -->
        <v-col
          v-for="{ event, members } in upcomingEvents"
          :key="event.event_id"
          md="3"
          sm="6"
          cols="12"
          class="content"
        >
          <router-link :to="getEventPath(event.community_account, event.event_id)">
            <EventCard class="event-card" :event="event" :members="members" />
          </router-link>
        </v-col>
        <template
          v-if="(upcomingEventListStore.eventStores?.length ?? 0) === (upcomingEventListStore.totalCount ?? Infinity)"
        >
          <v-col cols="12" class="text-h4 mt-10 ml-2">
            <v-row align="center">
              <v-icon size="40" :icon="mdiCalendarCheck" class="mr-1" />
              <span>{{ $t('top.past_events') }}</span>
            </v-row>
          </v-col>
          <!-- cols 等を修正した場合は numOfColumns も修正する必要あり -->
          <v-col v-for="{ event, members } in pastEvents" :key="event.event_id" md="3" sm="6" cols="12" class="content">
            <router-link :to="getEventPath(event.community_account, event.event_id)">
              <EventCard class="event-card" :event="event" :members="members" />
            </router-link>
          </v-col>
        </template>
      </v-row>
      <v-row>
        <v-col cols="12" class="text-center">
          <IncrementalLoader
            :total-count="(upcomingEventListStore.totalCount ?? Infinity) + (pastEventListStore.totalCount ?? Infinity)"
            :loaded-count="
              (upcomingEventListStore.eventStores?.length ?? 0) + (pastEventListStore.eventStores?.length ?? 0)
            "
            @load="next"
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
