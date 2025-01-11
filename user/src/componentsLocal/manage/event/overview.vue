<script setup lang="ts">
import { useEventStore, type EventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'
import { getManageEventSettingsPath, getManageEventListPath } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId) as EventStore
const deleteConfirmationDialog = ref(false)
const deleteEvent = async () => {
  await eventStore.deleteEvent()
  router.push(getManageEventListPath())
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="8" sm="9" cols="12" style="display: flex; gap: 8px">
        <v-btn variant="outlined" @click="router.push(getManageEventSettingsPath(eventId))">
          {{ $t('manage.event.edit') }}
        </v-btn>
        <v-btn
          v-if="eventStore.event != null && eventStore.event.event_status.value === 'in_draft'"
          variant="outlined"
          @click="deleteConfirmationDialog = true"
        >
          {{ $t('manage.event.delete') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="eventStore.event != null" class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <EventCard :event="eventStore.event" :members="eventStore.members ?? undefined" />
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="deleteConfirmationDialog" max-width="600px">
    <v-card>
      <v-card-title>
        {{ $t('manage.event.dialog.title') }}
      </v-card-title>
      <v-card-text>
        {{ $t('manage.event.dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteConfirmationDialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="tonal" @click="deleteEvent">
          {{ $t('manage.event.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
