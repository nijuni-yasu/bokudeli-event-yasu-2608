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

const fetchData = async () => {
  const userRef = doc(db, 'users', props.userId)
  const userDoc = await getDoc(userRef)
  state.userData = convertDocumentDataToStoredUser(userDoc.data())
  state.isLoading = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.userId !== from.params.userId) {
    await fetchData()
  }
  next()
})

onMounted(async () => {
  await fetchData()
})

// Stripeからのリダイレクトでイベントに参加した場合の処理
const eventId = ref('')
const communityAccount = ref('')
const isUserSuccessJoinEventDialogVisible = ref(false)

if (route.query.eventId && route.query.communityAccount) {
  eventId.value = route.query.eventId as string
  communityAccount.value = route.query.communityAccount as string
  isUserSuccessJoinEventDialogVisible.value = true
}
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
        <user-bio-panel :user-data="state.userData" :is-editable="storedUser?.userId === props.userId" />
      </v-col>
      <v-col cols="12" md="8" sm="8">
        <user-order-panel :user-id="props.userId" :show-detail="storedUser?.userId === props.userId" />
      </v-col>
    </v-row>
    <v-row v-else justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
