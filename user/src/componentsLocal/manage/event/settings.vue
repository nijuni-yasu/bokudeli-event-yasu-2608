<script setup lang="ts">
import { useEventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'
import EventEdit from '@/components/EventEdit.vue'

const route = useRoute()

const isEdit = ref(false)

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId)
</script>

<template>
  <v-container v-if="!isEdit">
    <v-row class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <v-btn variant="outlined" @click="isEdit = true">{{ $t('manage.event.edit') }}</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="eventStore.event != null" class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <EventCard :event="eventStore.event" :members="eventStore.members" />
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else>
    <EventEdit
      v-if="eventStore.event != null"
      :community-account="eventStore.event.community_account"
      :event-id="eventStore.event.event_id"
      step="4"
      @updated="isEdit = false"
    />
  </v-container>
</template>
