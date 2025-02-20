<script setup lang="ts">
import { useEventStore, type EventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'
import { getManageEventSettingsPath, getEventPath, getManageCommunityPath } from '@/router/utils'
import { mdiPencil, mdiDelete } from '@mdi/js'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId) as EventStore
const deleteConfirmationDialog = ref(false)
const deleteEvent = async () => {
  const communityAccount = eventStore.event!.community_account
  await eventStore.deleteEvent()
  window.location.href = getManageCommunityPath(communityAccount)
  // router.push(getManageEventListPath())
}
const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col v-if="eventStore.event != null" class="justify-center" md="4" sm="6" cols="12">
        <!-- <router-link :to="getEventPath(eventStore.event.community_account, eventStore.event.event_id)"> -->
        <EventCard
          :event="eventStore.event"
          :members="eventStore.members ?? undefined"
          @click="openInNew(getEventPath(eventStore.event.community_account, eventId))"
        />
        <!-- </router-link> -->
      </v-col>
      <v-col md="4" sm="6" cols="12" class="justify-center">
        <v-row>
          <v-btn
            class="ma-3"
            variant="outlined"
            :prepend-icon="mdiPencil"
            @click="router.push(getManageEventSettingsPath(eventId))"
          >
            {{ $t('manage.event.edit') }}
          </v-btn>
        </v-row>
        <v-row>
          <v-btn
            v-if="eventStore.event?.event_status.value === 'in_draft' && eventStore.confirmedOrders?.length === 0"
            class="ma-3"
            variant="outlined"
            :prepend-icon="mdiDelete"
            @click="deleteConfirmationDialog = true"
          >
            {{ $t('manage.event.delete') }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="deleteConfirmationDialog" max-width="600px">
    <v-card class="pa-2">
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
