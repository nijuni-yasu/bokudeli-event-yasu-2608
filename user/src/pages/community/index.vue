<script setup lang="ts">
import { convertTruncateText } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityPath } from '@/router/utils'
import { FirestoredUser } from '@/schemes/storedUser'
import { useCommunitiesStore, type CommunitiesStore } from '@/stores/community'
import { where } from 'firebase/firestore'

type CommunityWithMembers = {
  community: BokudeliCommunity
  members: FirestoredUser[]
}

const router = useRouter()

const communitiesStore = useCommunitiesStore() as CommunitiesStore
communitiesStore.filters = [
  where('is_public', '==', true),
]

const isLoading = computed(() => 
  communitiesStore.communityStores == null ||
  Array.from(communitiesStore.communityStores.values()).every((communityStore) => communityStore.community == null || communityStore.members == null)
)

const communityList = computed<CommunityWithMembers[]>(() => {
  const list = (communitiesStore.communityStores ?? [])
    .flatMap((communityStore) => (communityStore.community == null || communityStore.members == null) ? [] : {
      community: communityStore.community,
      members: communityStore.members,
    })
  list.sort((a, b) => b.members.length - a.members.length)
  return list
})
</script>

<template>
  <section>
    <v-row v-if="!isLoading" class="justify-center">
      <v-col
        v-for="{ community, members } in communityList"
        :key="community.community_id"
        md="10"
        sm="12"
        cols="12"
      >
        <v-card
          class="ma-1"
          color="text-center cursor-pointer"
          @click="router.push(getCommunityPath(community.community_account))"
        >
          <v-row>
            <v-col md="6" sm="12" cols="12" class="pa-0">
              <v-img
                :src="community.community_cover_image_url"
                style="border-radius: 5px 0px 0px 5px"
                aspect-ratio="1.91"
                cover
              />
            </v-col>
            <v-col md="6" sm="12" cols="12" class="d-flex flex-column">
              <!-- title -->
              <v-card-title class="text-h5 text-left py-3">
                {{ community.community_name }}
              </v-card-title>
              <v-card-text class="text-left pb-3">
                {{ convertTruncateText(community.community_desc, 250) }}
              </v-card-text>
              <v-spacer/>
              <!-- Mutual members -->
              <v-card-text class="mt-auto">
                <div class="mb-2">
                  <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
                </div>
                <div v-if="members" class="v-avatar-group">
                  <v-avatar v-for="member in members.slice(0,19) ?? []" :key="member.user_id" size="40">
                    <v-img v-if="member.user_image_url" :src="member.user_image_url" cover/>
                  </v-avatar>
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- no result found -->
      <v-col v-show="!communityList.length" cols="12" class="text-center">
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
