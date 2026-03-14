<script setup lang="ts">
import { useEventStore } from '@shokujii/base/stores/event.js'
import EventEdit from '@shokujii/base/components/EventEdit.vue'
import { getManageEventPath } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string
const step = (route.query.step as string | undefined) ?? '4'

const eventStore = useEventStore(eventId)
</script>

<template>
  <v-container class="manage-container">
    <EventEdit
      v-if="eventStore.event != null"
      :community-account="eventStore.event.community_account"
      :event-id="eventStore.event.event_id"
      :step="step"
      @updated="router.push(getManageEventPath(eventId))"
    />
  </v-container>
</template>
