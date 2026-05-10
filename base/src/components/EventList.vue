<script setup lang="ts">
import { computed, watch } from 'vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import IncrementalLoader from './IncrementalLoader.vue'
import EventStatusChip from './EventStatusChip.vue'
import { useEventListStore, type EventListStore } from '@shokujii/base/stores/eventList'
import { orderBy, where } from 'firebase/firestore'

const props = defineProps<{
  communityAccount: string
  selectedEventId?: string | null
  suggestFirst?: boolean
}>()

const emit = defineEmits<{
  click: [BokudeliEvent]
  suggestFirst: [BokudeliEvent]
}>()

const eventListStore = useEventListStore(
  [where('community_account', '==', props.communityAccount), orderBy('event_start_datetime', 'desc')],
  5,
) as EventListStore
const events = computed(() => {
  return (
    eventListStore.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      }
      return s.event
    }) ?? []
  )
})

const eventCoverUrls = computed(() => {
  const map = new Map<string, string | undefined>()
  eventListStore.eventStores?.forEach((s) => {
    if (s.event != null) {
      map.set(s.event.event_id, s.coverImageUrl)
    }
  })
  return map
})

watch(
  () => [props.suggestFirst === true, events.value] as const,
  ([suggest, list]) => {
    if (!suggest || list.length === 0) {
      return
    }
    const first = list[0]
    if (first != null) {
      emit('suggestFirst', first)
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-list class="list-with-borders">
    <v-list-item
      v-for="event of events"
      :key="event.event_id"
      :active="event.event_id === selectedEventId"
      @click="$emit('click', event)"
    >
      <template #prepend>
        <v-img
          :src="eventCoverUrls.get(event.event_id)"
          width="120"
          aspect-ratio="1.91"
          cover
          rounded="sm"
          class="mr-3"
        />
      </template>
      <v-list-item-title class="text-h6 py-1">{{ event.event_name }}</v-list-item-title>
      <div class="text-body-2">{{ $d(event.event_start_datetime, 'datetime') }}</div>
      <div class="text-body-2">{{ event.shop_name }}</div>
      <template #append>
        <EventStatusChip :status="event.calculatedEventStatus" size="x-small" />
      </template>
    </v-list-item>
    <v-list-item>
      <IncrementalLoader
        :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
        :loaded-count="eventListStore.eventStores?.length ?? 0"
        @load="eventListStore.next()"
      />
    </v-list-item>
  </v-list>
</template>

<style scoped>
.list-with-borders .v-list-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.v-list-item--active {
  background-color: rgb(var(--v-theme-primary) / 0.1) !important;
}
</style>
