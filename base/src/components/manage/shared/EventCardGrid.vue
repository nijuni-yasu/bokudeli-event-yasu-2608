<script setup lang="ts">
import EventCard from '@shokujii/base/components/EventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import type { BokudeliEvent, BokudeliEventMember } from '@shokujii/base/stores/event.js'
import type { ManageEventPathResolver } from '@shokujii/base/composable/managePathResolvers.js'

export type EventCardGridItem = {
  event: BokudeliEvent
  members: BokudeliEventMember[]
}

defineProps<{
  events: EventCardGridItem[]
  totalCount: number
  loadedCount: number
  /** cols props for v-col (default: cols=12 sm=6 md=4 lg=3) */
  colCols?: string
  colSm?: string
  colMd?: string
  colLg?: string
  getManageEventPath: ManageEventPathResolver
  showLoader?: boolean
}>()

const emit = defineEmits<{
  load: []
}>()
</script>

<template>
  <v-row>
    <v-col
      v-for="({ event, members }, i) of events"
      :key="event.event_id ?? `item_${i}`"
      :cols="colCols ?? '12'"
      :sm="colSm ?? '6'"
      :md="colMd ?? '4'"
      :lg="colLg ?? '3'"
    >
      <router-link :to="getManageEventPath(event.event_id)">
        <EventCard class="event-card" :event="event" :members="members" />
      </router-link>
    </v-col>
    <v-col v-if="showLoader !== false" cols="12">
      <v-row class="justify-center">
        <v-col cols="auto">
          <IncrementalLoader :total-count="totalCount" :loaded-count="loadedCount" @load="emit('load')" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.event-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
}
</style>
