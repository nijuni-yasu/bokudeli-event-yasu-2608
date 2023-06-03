<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'

import { useStoreStoredUser } from '@/stores/storedUser'

const store = useStoreStoredUser()
const { storedUser } = storeToRefs(store)
</script>

<template>
  <div id="user-view">
    <v-row justify="center">
      <v-col cols="auto">
        <user-bio-panel :user-data="storedUser"></user-bio-panel>
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
