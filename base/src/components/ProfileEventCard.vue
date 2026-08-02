<script setup lang="ts">
import EventCard from './EventCard.vue'
import { useAppEventStore } from '@shokujii/base/composable/useAppEventStore.js'
import { type BokudeliEvent } from '../stores/event.js'

const props = defineProps<{
  event: BokudeliEvent
}>()

const eventStore = useAppEventStore(props.event)
</script>

<template>
  <EventCard v-if="eventStore.event != null" :event="eventStore.event" :members="eventStore.members ?? []" />
</template>
