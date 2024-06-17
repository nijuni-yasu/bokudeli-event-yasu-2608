<script setup lang="ts">
import { useRoute } from 'vue-router'
import EventDetails from '@/components/pages/c/[communityId]/e/[eventId]/index.vue'

const communityId = useRoute().params.communityId as string
const eventId = useRoute().params.eventId as string
</script>

<template>
  <EventDetails :community-id="communityId" :event-id="eventId" />
</template>
