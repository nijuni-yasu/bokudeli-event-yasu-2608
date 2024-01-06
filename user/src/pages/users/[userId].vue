<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'
import UserOrderPanel from '@/components/UserOrderPanel.vue'
import UserCommunityPanel from '@/components/UserCommunityPanel.vue'
import { db } from '@/firebase'
import { convertDocumentDataToStoredUser } from '@/schemes/converter'
import StoredUser from '@/schemes/storedUser'
import { useStoreStoredUser } from '@/stores/storedUser'
import { doc, getDoc } from 'firebase/firestore'

const props = defineProps<{
  userId: string
}>()

const state = reactive({
  userData: {} as StoredUser,
  isLoading: true,
  tabs: null,
})

const { storedUser } = storeToRefs(useStoreStoredUser())

const fetchData = async () => {
  const userRef = doc(db, 'users', props.userId)
  const userDoc = await getDoc(userRef)
  state.userData = convertDocumentDataToStoredUser(userDoc.data())
  state.isLoading = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.userId !== from.params.userId || (to.query.eventId && to.query.communityAccount)) {
    await fetchData()
  }
  next()
})

onMounted(async () => {
  await fetchData()
})

</script>

<template>
  <div id="user-view">
    <v-row v-if="!state.isLoading" justify="center">
      <v-col cols="12" sm="8" md="3">
        <user-bio-panel :user-data="state.userData" :is-editable="storedUser?.userId === props.userId" />
      </v-col>
        <v-col cols="12" sm="8" md="9">
          <v-tabs v-model="state.tabs">
            <v-tab value="0">
              <v-icon start>
                mdi-calendar-star
              </v-icon>
              イベント
            </v-tab>
            <v-tab value="1">
              <v-icon start>
                mdi-account-group
              </v-icon>
              参加コミュニティ
            </v-tab>
            <v-tab value="2">
              <v-icon start>
                mdi-heart
              </v-icon>
              管理コミュニティ
            </v-tab>
          </v-tabs>
          <v-window v-model="state.tabs">
            <v-window-item value="0">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-order-panel :user-id="props.userId" :show-detail="storedUser?.userId === props.userId" />
              </v-col>
            </v-window-item>
            <v-window-item value="1">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-community-panel :user-id="props.userId" type="members" :is-login-user="storedUser?.userId === props.userId"/>
              </v-col>
            </v-window-item>
            <v-window-item value="2">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-community-panel :user-id="props.userId" type="managers" :is-login-user="storedUser?.userId === props.userId"/>
              </v-col>
            </v-window-item>
          </v-window>
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
