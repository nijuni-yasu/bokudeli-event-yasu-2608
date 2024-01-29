<script setup lang="ts">
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { CommunityStore, useCommunityStore } from '@/stores/community'
import { EventStore, useEventStore } from '@/stores/event'
import EventMemberCard from '@/components/EventMemberCard.vue'

const props = defineProps<{
  communityId: string
  eventId: string
}>()

const eventStore = useEventStore(props.eventId) as EventStore
const communityStore = useCommunityStore(props.communityId) as CommunityStore

const event = computed<BokudeliEvent | null>(() => eventStore.event)
const members = computed(() => eventStore.orderConfiremedMembers?.sort((a, b) => 
  a.orders.reduce((max, order) => Math.max(max, order.status !== 'ordered' ? 0 : order.updated_at.toMillis()), 0) -
  b.orders.reduce((max, order) => Math.max(max, order.status !== 'ordered' ? 0 : order.updated_at.toMillis()), 0)
) ?? [])

</script>
<template>
  <section>
    <div v-if="event != null && communityStore.community != null" class="justify-center">
      <v-row>
        <v-col v-for="member in members" :key="member.user_id" cols="2">
          <event-member-card :member="member" />
        </v-col>
      </v-row>
    </div>
    <div v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
<style scoped lang="scss">
</style>