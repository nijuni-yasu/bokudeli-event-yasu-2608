<script setup lang="ts">
import { db } from '@/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { convertDocumentDataToCommunity } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityPath } from '@/router/utils'
import { loadCommunityMembers } from '@/composable/loadCommunityMembers'
import { loadCommunityManagers } from '@/composable/loadCommunityManagers'
import { FirestoredUser } from '@/schemes/storedUser'

const router = useRouter()
const props = defineProps<{
  userId: string,
  type: string,
}>()

// TODO 更新順で並べる
const communityDb = query(collection(db, 'communities'), where('is_public', '==', true))

type CommunityWithMembers = {
  community: BokudeliCommunity
  members: FirestoredUser[]
}
const state = reactive({
  communityList: [] as CommunityWithMembers[],
  isLoading: true,
})

onMounted(async () => {
  const communitySnapshot = await getDocs(communityDb)
  const communityList = [] as CommunityWithMembers[]
  // TODO: 全てのコミュニティの全ての参加者情報を取得して速度重たいので要修正
  for (const docSnapshot of communitySnapshot.docs) {
    // 参加中のコミュニティと管理しているコミュニティを出し分ける
    if (props.type==="members") {
      const members = await loadCommunityMembers(docSnapshot.ref)
      if (members.some(member => member.user_id === props.userId)) {
        const community = convertDocumentDataToCommunity(docSnapshot.data())
        communityList.push({
          community,
          members: members,
        })
      }    
    } else if(props.type==="managers"){
      const members = await loadCommunityManagers(docSnapshot.ref)
      if (members.some(member => member.user_id === props.userId)) {
        const community = convertDocumentDataToCommunity(docSnapshot.data())
        communityList.push({
          community,
          members: members,
        })
      }
    }
  }
  state.communityList = communityList
  state.isLoading = false
})
</script>

<template>
  <section>
    <v-row v-if="!state.isLoading" class="justify-center">
      <v-col
        v-for="{ community, members } in state.communityList"
        :key="community.communityId"
        md="12"
        sm="12"
        cols="12"
      >
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
                  <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
                  <div class="v-avatar-group">
                    <v-avatar v-for="member in members" :key="member.user_id" size="40">
                      <v-img v-if="member.user_image_url" :src="member.user_image_url" cover/>
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
      <v-row v-show="props.type===`managers`" class="justify-center">
        <v-col class="text-center">
          <v-btn
            class="mx-2 my-10 text-lg-h5"
            color="grey-900"
            size="x-large"
            rounded
            width="60%"
            href="https://forms.gle/z9L88Dq7vDKwbvxMA"
            target="_blank"
          >
            <v-icon start>
              mdi-plus-circle
            </v-icon>
            コミュニティをつくる
          </v-btn>
        </v-col>
      </v-row>
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
