<script setup lang="ts">
import EventCard from './EventCard.vue'
import { useEventStore, type BokudeliEvent } from '../stores/event.js'

const props = defineProps<{
  event: BokudeliEvent
}>()

const eventStore = useEventStore(props.event)
</script>

<template>
  <EventCard v-if="eventStore.event != null" :event="eventStore.event" :members="eventStore.members ?? []" />
</template>
