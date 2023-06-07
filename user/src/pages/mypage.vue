<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'

import { useStoreStoredUser } from '@/stores/storedUser'

const store = useStoreStoredUser()
const { storedUser } = storeToRefs(store)
</script>

<template>
  <div id="user-view">
    <v-row justify="center">
      <v-col cols="12" md="5" sm="5">
        <user-bio-panel :user-data="storedUser" is-editable></user-bio-panel>
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
