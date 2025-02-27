<script setup lang="ts">
import EventEdit from '@/components/EventEdit.vue'
import { getManageEventPath } from '@/router/utils'

const route = useRoute()

const communityAccount = route.params.communityAccount as string

const updated = (eventId: string) => {
  // useEventListStore().reload()
  // router.push(getManageEventPath(eventId))
  window.location.href = getManageEventPath(eventId)
}
</script>

<template>
  <v-container>
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
