<script setup lang="ts">
import { useAppEventStore } from '@shokujii/base/composable/useAppEventStore.js'
import EventEdit from '@shokujii/base/components/EventEdit.vue'
import { getEventPath } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string
const step = (route.query.step as string | undefined) ?? '4'

const eventStore = useAppEventStore(eventId)
</script>

<template>
  <v-container class="manage-container">
    <EventEdit
      v-if="eventStore.event != null"
      :community-account="eventStore.event.community_account"
      :event-id="eventStore.event.event_id"
      :step="step"
      @updated="router.push(getEventPath(eventStore.event.community_account, eventId))"
    />
  </v-container>
</template>
