<script setup lang="ts">
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import type { CommunityListStore } from '@shokujii/base/stores/communityList.js'
import type { BokudeliCommunity, BokudeliCommunityMember } from '@shokujii/base/stores/community.js'
import type { ProfileLinkPolicyFn, ResolveCommunityPathFn } from '@shokujii/base/types/profilePathResolvers.js'

export type UserProfileCommunityListItem = {
  community: BokudeliCommunity
  members: BokudeliCommunityMember[]
}

defineProps<{
  memberCommunities: UserProfileCommunityListItem[]
  managerCommunities: UserProfileCommunityListItem[]
  showJoinedSection: boolean
  showManagedSection: boolean
  memberCommunityListHasMore: boolean
  managerCommunityListHasMore: boolean
  memberCommunityListStore: CommunityListStore
  managerCommunityListStore: CommunityListStore
  isCommunitiesTabReady: boolean
  isCommunitiesTabEmpty: boolean
  canLinkToDetail: ProfileLinkPolicyFn
  resolveCommunityPath: ResolveCommunityPathFn
}>()

const { t: $t } = useI18n()
</script>

<template>
  <div v-if="isCommunitiesTabReady && isCommunitiesTabEmpty" class="text-body-1 text-medium-emphasis pa-4">
    {{ $t('user_profile.empty.communities') }}
  </div>
  <template v-else-if="isCommunitiesTabReady">
    <template v-if="showJoinedSection">
      <h3 class="profile-community-subsection-title mt-2 mb-2">
        {{ $t('user_profile.section.joined_communities') }}
      </h3>
      <v-row>
        <v-col v-for="{ community, members } in memberCommunities" :key="`member_${community.community_id}`" cols="12">
          <router-link
            v-if="canLinkToDetail(community.is_public)"
            :to="resolveCommunityPath(community.community_account)"
          >
            <CommunityCard :community="community" :members="members" />
          </router-link>
          <div v-else>
            <CommunityCard :community="community" :members="members" />
          </div>
        </v-col>
      </v-row>
    </template>
    <v-row
      v-if="memberCommunityListHasMore || memberCommunities.length > 0"
      class="justify-center"
      :class="{ 'mt-2': showJoinedSection }"
    >
      <v-col cols="auto">
        <IncrementalLoader
          :loaded-count="memberCommunityListStore.communityStores?.length ?? 0"
          :total-count="memberCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
          @load="memberCommunityListStore.next()"
        />
      </v-col>
    </v-row>

    <template v-if="showManagedSection">
      <h3 class="profile-community-subsection-title mt-6 mb-2">
        {{ $t('user_profile.section.managed_communities') }}
      </h3>
      <v-row>
        <v-col
          v-for="{ community, members } in managerCommunities"
          :key="`manager_${community.community_id}`"
          cols="12"
        >
          <router-link
            v-if="canLinkToDetail(community.is_public)"
            :to="resolveCommunityPath(community.community_account)"
          >
            <CommunityCard :community="community" :members="members" />
          </router-link>
          <div v-else>
            <CommunityCard :community="community" :members="members" />
          </div>
        </v-col>
      </v-row>
    </template>
    <v-row v-if="managerCommunityListHasMore || managerCommunities.length > 0" class="justify-center mt-2">
      <v-col cols="auto">
        <IncrementalLoader
          :loaded-count="managerCommunityListStore.communityStores?.length ?? 0"
          :total-count="managerCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
          @load="managerCommunityListStore.next()"
        />
      </v-col>
    </v-row>
  </template>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
