<script setup lang="ts">
import { useEventStore } from '@/stores/event'
import EventEdit from '@/components/EventEdit.vue'
import { getManageEventPath } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId)
</script>

<template>
  <v-container>
    <EventEdit
      v-if="eventStore.event != null"
      :community-account="eventStore.event.community_account"
      :event-id="eventStore.event.event_id"
      step="4"
      @updated="router.push(getManageEventPath(eventId))"
    />
  </v-container>
</template>
