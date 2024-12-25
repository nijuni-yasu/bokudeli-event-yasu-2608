<script setup lang="ts">
import EventEdit from '@/components/EventEdit.vue'
import { getManageEventPath } from '@/router/utils'

const route = useRoute()
const router = useRouter()

const communityAccount = route.params.communityAccount as string

const updated = (eventId: string) => {
  router.push(getManageEventPath(eventId))
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <EventEdit :community-account="communityAccount" @updated="updated" />
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
