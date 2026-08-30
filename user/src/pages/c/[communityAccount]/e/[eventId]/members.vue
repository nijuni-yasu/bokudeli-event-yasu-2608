<script setup lang="ts">
import { useRoute } from 'vue-router'
import Members from '@shokujii/base/components/pages/c/[communityAccount]/e/[eventId]/members.vue'
import { usePublicEventNotFoundRedirect } from '@shokujii/base/composable/usePublicEventNotFoundRedirect.js'

const communityAccount = useRoute().params.communityAccount as string
const eventId = useRoute().params.eventId as string

usePublicEventNotFoundRedirect(eventId, communityAccount)
</script>

<template>
  <Members :community-account="communityAccount" :event-id="eventId" />
</template>
