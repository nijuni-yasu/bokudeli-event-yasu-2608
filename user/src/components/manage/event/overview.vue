<script setup lang="ts">
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import EventCard from '@shokujii/base/components/EventCard.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import {
  getEventEditPathByRawStatus,
  getEventPath,
  getManageCommunityPath,
  getManageCommunityInvoicePath,
} from '@/router/utils'
import { mdiPencil, mdiDelete, mdiFilePdfBox } from '@mdi/js'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId) as EventStore
const deleteConfirmationDialog = ref(false)
const deleteCompleteDialog = ref(false)

const deleteEvent = async () => {
  await eventStore.deleteEvent()
  deleteConfirmationDialog.value = false
  deleteCompleteDialog.value = true
}

const handleDeleteCompleteOk = () => {
  const communityAccount = eventStore.event?.community_account
  if (communityAccount) {
    window.location.href = getManageCommunityPath(communityAccount)
  }
}
const openInNew = (url: string) => {
  window.open(url, '_blank')
}

const goToEventEdit = () => {
  const e = eventStore.event
  if (e != null) {
    void router.push(getEventEditPathByRawStatus(eventId, e.event_status.value))
  }
}
</script>

<template>
  <v-container class="manage-container">
    <v-row v-if="eventStore.event?.event_payment === 'community_bill'" class="justify-center mb-2">
      <v-col md="12" sm="12" cols="12">
        <v-alert variant="tonal" color="primary" :icon="mdiFilePdfBox" density="comfortable">
          <div class="text-subtitle-1 font-weight-bold mb-1">
            {{ $t('manage.event.community_bill_notice.title') }}
          </div>
          <div class="text-body-2" v-html="$t('manage.event.community_bill_notice.description')" />
          <div class="d-flex align-center flex-wrap mt-3">
            <span class="text-body-2 me-2">{{ $t('manage.event.community_bill_notice.link_label') }}</span>
            <v-btn
              variant="outlined"
              size="small"
              color="primary"
              :prepend-icon="mdiFilePdfBox"
              :to="getManageCommunityInvoicePath(eventStore.event.community_account)"
            >
              {{ $t('manage.event.community_bill_notice.link_button') }}
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>
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
            :disabled="eventStore.event == null"
            @click="goToEventEdit"
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
  <ConfirmDialog
    v-model="deleteCompleteDialog"
    :title="$t('manage.event.dialog.complete')"
    ok-text="OK"
    :ok-click="handleDeleteCompleteOk"
    max-width="500px"
  />
</template>
