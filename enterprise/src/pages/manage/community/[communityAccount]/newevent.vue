<script setup lang="ts">
import EventEdit from '@shokujii/base/components/EventEdit.vue'
import { getEventPath } from '@/router/utils'

const route = useRoute()
const router = useRouter()

const communityAccount = route.params.communityAccount as string

const updated = (eventId: string) => {
  router.push(getEventPath(communityAccount, eventId))
}
</script>

<template>
  <v-container class="manage-container">
    <v-row class="justify-center">
      <v-col md="12" sm="12" cols="12">
        <EventEdit :community-account="communityAccount" @updated="updated" />
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
