<script setup lang="ts">
import { useRoute } from 'vue-router'
import Members from '@/components/pages/c/[communityId]/e/[eventId]/members.vue'

const communityId = useRoute().params.communityId as string
const eventId = useRoute().params.eventId as string
</script>

<template>
  <Members :community-id="communityId" :event-id="eventId" />
</template>
