<script setup lang="ts">
import type BokudeliEvent from '@shokujii/base/schemes/bokudeliEvent'
import IncrementalLoader from './IncrementalLoader.vue'
import { useEventListStore, type EventListStore } from '@shokujii/base/stores/eventList'
import { orderBy, where } from 'firebase/firestore'

const props = defineProps<{
  communityAccount: string
}>()

defineEmits<{
  click: [BokudeliEvent]
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
</script>

<template>
  <v-list class="list-with-borders">
    <v-list-item v-for="event of events" :key="event.event_id" @click="$emit('click', event)">
      <v-list-item-title>{{ event.event_name }}</v-list-item-title>
      <div class="text-body-2">{{ $d(event.event_start_datetime!.toDate(), 'datetime') }}</div>
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
</style>
