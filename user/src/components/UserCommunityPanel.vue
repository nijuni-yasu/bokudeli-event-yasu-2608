<script setup lang="ts">
import { db } from '@/firebase'
import { doc, where } from 'firebase/firestore'
import { convertTruncateText } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityPath, getCommunitySettingsPath, getEventCreatePath } from '@/router/utils'
import { useCommunitiesStore, type CommunitiesStore } from '@/stores/community'
import { CommunityMember } from '@/schemes/communityMember'

const router = useRouter()
const props = defineProps<{
  userId: string,
  type: 'members' | 'managers',
  isLoginUser: boolean,
}>()
type CommunityWithMembers = {
  community: BokudeliCommunity
  members: CommunityMember[]
}

const communitiesStore = useCommunitiesStore() as CommunitiesStore

communitiesStore.filters = [
  where('members', 'array-contains', doc(db, 'users', props.userId)),
]

const communityList = computed<CommunityWithMembers[]>(() => (communitiesStore.communityStores ?? [])
  .flatMap((communityStore) => {
    if (communityStore.community == null) {
      return []
    }
    if (props.type === 'managers') {
      return communityStore.members?.some((member) => member.user_id === props.userId && (member.roles?.includes('manager') ?? false)) ? {
        community: communityStore.community,
        members: communityStore.members,
      } : []
    } else {
      return communityStore.members?.some((member) => member.user_id === props.userId) ? {
        community: communityStore.community,
        members: communityStore.members,
      } : []
    }
  }).sort((a, b) => b.members.length - a.members.length)
)

const isLoading = computed(() => communitiesStore.communityStores == null)
</script>

<template>
  <section>
    <v-row v-if="!isLoading" class="justify-center">
      <v-col
        v-for="{ community, members } in communityList"
        :key="community.communityId"
        md="12"
        sm="12"
        cols="12"
      >
        <v-card
          class="mx-2 mt-2 mb-1"
          color="text-center cursor-pointer"
          @click="router.push(getCommunityPath(community.communityAccount))"
        >
          <v-row>
            <v-col md="6" sm="12" cols="12" class="pa-0">
              <v-img
                :src="community.communityCoverImageUrl"
                style="border-radius: 5px 0px 0px 5px"
                aspect-ratio="1.91"
                cover
              />
            </v-col>
            <v-col md="6" sm="12" cols="12" class="d-flex flex-column">
              <!-- title -->
              <v-card-title class="text-h5 text-left py-3">
                {{ community.communityName }}
              </v-card-title>
              <v-card-text class="text-left pb-3">
                {{ convertTruncateText(community.communityDescription, 100) }}
              </v-card-text>
              <v-spacer/>
              <!-- Mutual members -->
              <v-card-text class="mt-auto">
                <div class="my-2">
                  <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
                </div>
                <div v-if="members" class="v-avatar-group">
                  <v-avatar v-for="member in members.slice(0,17) ?? []" :key="member.user_id" size="40">
                    <v-img v-if="member.user_image_url" :src="member.user_image_url" cover/>
                  </v-avatar>
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
        <div v-if="props.type===`managers`&&props.isLoginUser" class="justify-center">
          <v-col class="text-right">
            <v-btn
              class="mx-1 mb-1 mt-0"
              color="white"
              elevation="5"
              size="small"
              rounded
              target="_blank"
              prepend-icon="mdi-pencil-box-outline"
              @click="router.push(getEventCreatePath(community.communityAccount))"
            >
              イベント新規作成
            </v-btn>
            <v-btn
              class="mx-1 mb-1 mt-0"
              color="white"
              elevation="5"
              size="small"
              rounded
              target="_blank"
              prepend-icon="mdi-cog"
              @click="router.push(getCommunitySettingsPath(community.communityAccount))"
            >
              コミュニティ設定
            </v-btn>
          </v-col>
        </div>
      </v-col>
      <!-- no result found -->
      <v-col v-show="!communityList.length" cols="12" class="text-center">
        <h4 class="mt-4">Search result not found!!</h4>
      </v-col>
      <v-row v-show="props.type===`managers`&&props.isLoginUser" class="justify-center">
        <v-col class="text-center">
          <v-btn
            class="my-10"
            color="white"
            elevation="10"
            size="large"
            rounded
            prepend-icon="mdi-heart"
            href="https://forms.gle/z9L88Dq7vDKwbvxMA"
            target="_blank"
          >
            コミュニティを新規申請する
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
