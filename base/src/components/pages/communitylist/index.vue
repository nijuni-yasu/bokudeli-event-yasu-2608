<script setup lang="ts">
/**
 * Deprecated
 * Use ../CommunityCard.vue instead
 */
import { convertTruncateText } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { getCommunityPath } from '@/router/utils'
import { useCommunitiesStore, type CommunitiesStore } from '@/stores/community'
import { orderBy, where } from 'firebase/firestore'

const loadingElement = ref()
let observer: IntersectionObserver
let isVisible = false

const communitiesStore = useCommunitiesStore([
  where('is_public', '==', true),
  where('is_approved', '==', true),
  orderBy('community_num_members', 'desc'),
]) as CommunitiesStore
communitiesStore.setPageSize(5)

const hasMore = computed(() => {
  if (communitiesStore.totalCount == null || communitiesStore.communityStores?.length == null) {
    return true
  }
  return communitiesStore.communityStores.length < communitiesStore.totalCount
})

const communityList = computed<BokudeliCommunity[]>(() => {
  return (communitiesStore.communityStores ?? []).flatMap((communityStore) =>
    communityStore.community == null ? [] : communityStore.community,
  )
})

watch(communityList, () => {
  if (isVisible) {
    communitiesStore.next()
  }
})

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible = true
          communitiesStore.next()
        } else {
          isVisible = false
        }
      })
    },
    {
      // オプションでroot、rootMargin、thresholdを設定可能
      threshold: 0.1, // 10%の部分が見えたらトリガー
    },
  )

  if (loadingElement.value?.$el != null) {
    observer.observe(loadingElement.value.$el)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section>
    <v-row class="justify-center">
      <v-col v-for="community in communityList" :key="community.community_id" md="10" sm="12" cols="12">
        <router-link :to="getCommunityPath(community.community_account)">
          <v-card class="ma-1" color="text-center cursor-pointer">
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
                <v-spacer />
                <!-- Mutual members -->
                <!-- <v-card-text class="mt-auto">
                  <div class="mb-2">
                    <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
                  </div>
                  <div v-if="members" class="v-avatar-group">
                    <UserAvatar
                      v-for="(member, i) in members.slice(0,19) ?? []"
                      :key="member?.user_id ?? `${community.community_name}_avatar_${i}`"
                      :user="member"
                      :size="40"
                    />
                  </div>
                </v-card-text> -->
              </v-col>
            </v-row>
          </v-card>
        </router-link>
      </v-col>

      <!-- no result found -->
      <v-col v-show="!communityList.length" cols="12" class="text-center">
        <h4 class="mt-4">Search result not found!!</h4>
      </v-col>
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
