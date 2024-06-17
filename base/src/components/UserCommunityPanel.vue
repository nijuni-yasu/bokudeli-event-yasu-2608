<script setup lang="ts">
import { db } from '@/firebase'
import { doc, orderBy, where } from 'firebase/firestore'
import { convertTruncateText } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityCreatePath, getCommunityPath, getCommunitySettingsPath, getEventCreatePath } from '@/router/utils'
import { useCommunitiesStore, type CommunitiesStore } from '@/stores/community'
import { type CommunityMember } from '@/schemes/communityMember'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const props = defineProps<{
  userId: string,
  type: 'members' | 'managers',
  isLoginUser: boolean,
}>()
type CommunityWithMembers = {
  community: BokudeliCommunity
  members: (CommunityMember | null)[]
}

const loadingElement = ref()
let observer: IntersectionObserver
let isVisible = false

const hasMore = computed(() => {
  if (communitiesStore.totalCount == null || communitiesStore.communityStores?.length == null) {
    return true
  }
  return communitiesStore.communityStores.length < communitiesStore.totalCount
})

const communitiesStore = useCommunitiesStore([
  where('members', 'array-contains', doc(db, 'users', props.userId)),
  orderBy('community_num_members', 'desc'),
]) as CommunitiesStore
communitiesStore.setPageSize(5)

const communityList = computed<CommunityWithMembers[]>(() => (communitiesStore.communityStores ?? [])
  .flatMap((communityStore) => {
    if (communityStore.community == null) {
      return []
    }
    if (props.type === 'managers') {
      return communityStore.members?.some((member) => member?.user_id === props.userId && (member?.roles?.includes('manager') ?? false)) ? {
        community: communityStore.community,
        members: communityStore.members,
      } : []
    } else {
      return communityStore.members?.some((member) => member?.user_id === props.userId) ? {
        community: communityStore.community,
        members: communityStore.members,
      } : []
    }
  })
)

watch(() => communitiesStore.communityStores, () => {
  if (isVisible) {
    communitiesStore.next()
  }
})

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible = true
        communitiesStore.next()
      } else {
        isVisible = false
      }
    });
  }, {
    // オプションでroot、rootMargin、thresholdを設定可能
    threshold: 0.1 // 10%の部分が見えたらトリガー
  });

  if (loadingElement.value?.$el != null) {
    observer.observe(loadingElement.value.$el);
  }
});

onUnmounted(() => {
  observer?.disconnect();
})
</script>

<template>
  <section>
    <v-row class="justify-center">
      <v-col
        v-for="{ community, members } in communityList"
        :key="community.community_id"
        md="12"
        sm="12"
        cols="12"
      >
        <v-card
          class="mx-2 mt-2 mb-1"
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
                {{ convertTruncateText(community.community_desc, 100) }}
              </v-card-text>
              <v-spacer/>
              <!-- Mutual members -->
              <v-card-text class="mt-auto">
                <div class="my-2">
                  <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
                </div>
                <div v-if="members" class="v-avatar-group">
                  <UserAvatar
                    v-for="(member, i) in members.slice(0,17) ?? []"
                    :key="member?.user_id ?? `${community.community_name}_avatar_${i}`"
                    :user="member"
                    :size="40"
                  />
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
        <div v-if="props.type===`managers`&&props.isLoginUser" class="justify-center">
          <v-col class="text-right">
            <v-btn
              v-if="community.is_approved === true"
              class="mx-1 mb-1 mt-0"
              color="white"
              elevation="5"
              size="small"
              rounded
              target="_blank"
              prepend-icon="mdi-pencil-box-outline"
              @click="router.push(getEventCreatePath(community.community_account))"
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
              @click="router.push(getCommunitySettingsPath(community.community_account))"
            >
              コミュニティ設定
            </v-btn>
          </v-col>
        </div>
      </v-col>
      <!-- no result found -->
      <v-col v-show="communitiesStore.communityStores?.length === 0" cols="12" class="text-center">
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
            prepend-icon="mdi-heart-outline"
            @click="router.push(getCommunityCreatePath())"
          >
            コミュニティを作る
          </v-btn>
        </v-col>
      </v-row>
    </v-row>
    <v-row v-if="hasMore" class="justify-center">
      <v-col cols="auto">
        <v-progress-circular ref="loadingElement" indeterminate color="primary"></v-progress-circular>
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
