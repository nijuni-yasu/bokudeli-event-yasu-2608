<script setup lang="ts">
import { where, orderBy } from 'firebase/firestore'
import { useEventListStore } from '@/stores/eventList'
import EventCard from '@/components/EventCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'
import { mdiPlus } from '@mdi/js'
import { getManageEventPath } from '@/router/utils'

const communityAccount = useRoute().params.communityAccount as string

const display = useDisplay()

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

const eventListStore = useEventListStore(
  [where('community_account', '==', communityAccount), orderBy('event_start_datetime', 'desc')],
  numOfColumns.value,
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
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-btn variant="outlined" :prepend-icon="mdiPlus"> {{ $t('manage.new_event') }} </v-btn>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col cols="12" sm="12" md="12" class="px-0">
        <v-row>
          <v-col v-for="({ event, members }, i) of events" :key="`item_${i}`" cols="12" sm="6" md="4" lg="3">
            <router-link v-if="event != null" :to="{ path: getManageEventPath(event.event_id) }">
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
  </v-container>
</template>

<style scoped lang="scss">
.event-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
}
</style>
