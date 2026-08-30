<script setup lang="ts">
import { useRoute } from 'vue-router'
import Members from '@shokujii/base/components/pages/c/[communityAccount]/e/[eventId]/members.vue'
import { usePublicEventNotFoundRedirect } from '@shokujii/base/composable/usePublicEventNotFoundRedirect.js'
import { buildEventStoreOptions } from '@shokujii/base/stores/event.js'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

const communityAccount = useRoute().params.communityAccount as string
const eventId = useRoute().params.eventId as string
const { enterpriseId } = useEnterpriseId()
if (enterpriseId.value == null) {
  throw new Error('Enterprise is not resolved')
}

usePublicEventNotFoundRedirect(eventId, buildEventStoreOptions(enterpriseId.value))
</script>

<template>
  <Members :community-account="communityAccount" :event-id="eventId" />
</template>
