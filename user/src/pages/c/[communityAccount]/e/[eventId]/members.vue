<script setup lang="ts">
import { useRoute } from 'vue-router'
import Members from '@shokujii/base/components/pages/c/[communityAccount]/e/[eventId]/members.vue'

const communityAccount = useRoute().params.communityAccount as string
const eventId = useRoute().params.eventId as string
</script>

<template>
  <Members :community-account="communityAccount" :event-id="eventId" />
</template>
