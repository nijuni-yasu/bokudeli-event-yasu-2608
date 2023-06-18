<script setup lang="ts">
import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'
import avatarImageList from '@/assets/examples/avatarImageList'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityPath } from '@/router/utils'

const router = useRouter()
const communityDb = collection(db, 'communities')

const state = reactive({
  communityList: [] as BokudeliCommunity[],
  isLoading: true,
})

onMounted(async () => {
  const communitySnapshot = await getDocs(communityDb)
  state.communityList = communitySnapshot.docs.map((doc) => {
    return convertDocumentDataToCommunity(doc.data())
  })
  state.isLoading = false
})
</script>

<template>
  <section>
    <v-row v-if="state.isLoading === false" class="justify-center">
      <v-col v-for="community in state.communityList" :key="community.communityId" md="10" sm="10" cols="10">
        <v-card
          class="ma-2"
          color="text-center cursor-pointer"
          @click="router.push(getCommunityPath(community.communityAccount))"
        >
          <v-row>
            <v-col md="6" sm="6" cols="6" class="pa-0">
              <v-img
                :src="community.communityCoverImageUrl"
                style="border-radius: 5px 0px 0px 5px"
                aspect-ratio="2"
                cover
              />
            </v-col>
            <v-col md="6" sm="6" cols="6">
              <!-- title -->
              <v-card-title class="text-h5 text-left py-3">
                {{ community.communityName }}
              </v-card-title>
              <v-card-text class="text-left pb-3">
                {{ community.communityDescription }}
              </v-card-text>
              <!-- Mutual members -->
              <v-card-text class="position-relative">
                <div class="d-flex justify-space-between align-center mt-8">
                  <span class="text--primary font-weight-medium"> 5 members </span>
                  <div class="v-avatar-group">
                    <v-avatar v-for="i in 8" :key="i" size="40">
                      <v-img :src="avatarImageList[i % 8]"></v-img>
                    </v-avatar>
                  </div>
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- no result found -->
      <v-col v-show="!state.communityList.length" cols="12" class="text-center">
        <h4 class="mt-4">Search result not found!!</h4>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </section>
</template>

<style lang="scss" scoped>
.avatar-center {
  top: -2rem;
  left: 1rem;
  border: 3px solid white;
  position: absolute;
}
</style>
