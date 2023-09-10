<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'
import UserOrderPanel from '@/components/UserOrderPanel.vue'
import UserSuccessJoinEventDialog from '@/components/UserSuccessJoinEventDialog.vue'
import { db } from '@/firebase'
import { convertDocumentDataToStoredUser } from '@/schemes/converter'
import StoredUser from '@/schemes/storedUser'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useRoute } from 'vue-router'

import { doc, getDoc } from 'firebase/firestore'

const route = useRoute()
const props = defineProps<{
  userId: string
}>()

const state = reactive({
  userData: {} as StoredUser,
  isLoading: true,
})

const { storedUser } = storeToRefs(useStoreStoredUser())
let isUserSuccessJoinEventDialogVisible = ref(false)

let eventId: any = null
let communityAccount: any = null

if (route.query.eventId && route.query.communityAccount) {
  eventId = route.query.eventId
  communityAccount = route.query.communityAccount
  isUserSuccessJoinEventDialogVisible = ref(true)
}

onMounted(async () => {
  const userRef = doc(db, 'users', props.userId)
  const userDoc = await getDoc(userRef)
  state.userData = convertDocumentDataToStoredUser(userDoc.data())
  state.isLoading = false
})
</script>

<template>
  <div id="user-view">
    <user-success-join-event-dialog
      v-model="isUserSuccessJoinEventDialogVisible"
      :event-id="eventId"
      :community-account="communityAccount"
    ></user-success-join-event-dialog>
    <v-row v-if="!state.isLoading" justify="center">
      <v-col cols="12" md="3" sm="3">
        <user-bio-panel :user-data="state.userData" :is-editable="storedUser?.userId === props.userId"></user-bio-panel>
      </v-col>
      <v-col cols="12" md="8" sm="8">
        <user-order-panel></user-order-panel>
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
