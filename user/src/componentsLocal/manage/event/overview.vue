<script setup lang="ts">
import { useEventStore } from '@/stores/event'
import EventCard from '@/components/EventCard.vue'
import { getManageEventSettingsPath } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId)
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <v-btn variant="outlined" @click="router.push(getManageEventSettingsPath(eventId))">
          {{ $t('manage.event.edit') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="eventStore.event != null" class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <EventCard :event="eventStore.event" :members="eventStore.members" />
      </v-col>
    </v-row>
  </v-container>
</template>
