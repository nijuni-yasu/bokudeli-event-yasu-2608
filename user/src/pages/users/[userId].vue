<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'
import { db } from '@/firebase'
import { convertDocumentDataToStoredUser } from '@/schemes/converter'
import StoredUser from '@/schemes/storedUser'

import { doc, getDoc } from 'firebase/firestore'

const props = defineProps<{
  userId: string
}>()

const state = reactive({
  userData: {} as StoredUser,
  isLoading: true,
})

onMounted(async () => {
  const userRef = doc(db, 'users', props.userId)
  const userDoc = await getDoc(userRef)
  state.userData = convertDocumentDataToStoredUser(userDoc.data())
  state.isLoading = false
})
</script>

<template>
  <div>
    <v-row v-if="!state.isLoading" justify="center">
      <v-col cols="auto">
        <user-bio-panel :user-data="state.userData"></user-bio-panel>
      </v-col>
    </v-row>
    <v-row v-else justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
