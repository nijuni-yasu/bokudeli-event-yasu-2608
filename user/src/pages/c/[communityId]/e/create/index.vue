<script setup lang="ts">
import { useRoute } from 'vue-router'
import EventEdit from '@/components/EventEdit.vue'
import { getEventPath } from '@/router/utils'

const route = useRoute()
const router = useRouter()

const communityAccount = route.params.communityId as string
const eventId = ref(route.query.id as string | undefined)
const step = ref(route.query.step as string | undefined)
</script>

<template>
  <EventEdit
    v-if="eventId != null"
    :community-account="communityAccount"
    :event-id="eventId"
    :step="step"
    @updated="router.push(getEventPath(communityAccount, eventId))"
  />
</template>
