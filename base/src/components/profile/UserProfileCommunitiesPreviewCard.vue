<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { mdiAccountGroup } from '@mdi/js'
import type { UserProfileCommunityPreviewItem } from '@shokujii/common/apis/userProfile.js'
import type { ProfileCommunityIconUrlFn } from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ProfileLinkPolicyFn, ResolveCommunityPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import UserProfileCommunityPreviewTile from '@shokujii/base/components/profile/UserProfileCommunityPreviewTile.vue'

const props = defineProps<{
  joinedCommunities: UserProfileCommunityPreviewItem[]
  managedCommunities: UserProfileCommunityPreviewItem[]
  isInitialLoading: boolean
  isEmpty: boolean
  showJoinedSection: boolean
  showManagedSection: boolean
  canLinkToDetail: ProfileLinkPolicyFn
  resolveCommunityPath: ResolveCommunityPathFn
  communityIconUrl: ProfileCommunityIconUrlFn
}>()

const emit = defineEmits<{
  showMore: []
}>()

const communityLinkTo = (
  c: UserProfileCommunityPreviewItem,
  canLinkToDetail: ProfileLinkPolicyFn,
  resolveCommunityPath: ResolveCommunityPathFn,
): RouteLocationRaw | undefined =>
  canLinkToDetail(c.is_public, c.is_linkable) ? resolveCommunityPath(c.community_account) : undefined
</script>

<template>
  <v-card elevation="2" class="profile-panel-card mb-4">
    <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
      <v-icon :icon="mdiAccountGroup" size="18" class="profile-section-title__icon text-medium-emphasis me-1" />
      <span class="profile-section-title">{{ $t('user_profile.tab_communities') }}</span>
      <v-spacer />
      <v-btn variant="text" size="small" @click="emit('showMore')">{{ $t('user_profile.show_more') }}</v-btn>
    </v-card-title>
    <v-card-text class="pt-0">
      <v-row v-if="props.isInitialLoading" dense>
        <v-col v-for="n in 4" :key="`community-skeleton-${n}`" cols="6" sm="4" md="3">
          <v-skeleton-loader type="list-item-avatar-two-line" class="profile-preview-skeleton" />
        </v-col>
      </v-row>
      <div v-else-if="props.isEmpty" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.empty.communities') }}
      </div>
      <template v-else>
        <template v-if="props.showJoinedSection">
          <h3 class="profile-community-subsection-title mb-3">
            {{ $t('user_profile.section.joined_communities') }}
          </h3>
          <v-row dense class="mb-6">
            <v-col v-for="c in props.joinedCommunities" :key="`joined_${c.community_id}`" cols="6" sm="4" md="3">
              <UserProfileCommunityPreviewTile
                :community-name="c.community_name"
                :is-public="c.is_public"
                :icon-url="props.communityIconUrl(c.community_id)"
                :link-to="communityLinkTo(c, props.canLinkToDetail, props.resolveCommunityPath)"
              />
            </v-col>
          </v-row>
        </template>

        <template v-if="props.showManagedSection">
          <h3 class="profile-community-subsection-title mb-3">
            {{ $t('user_profile.section.managed_communities') }}
          </h3>
          <v-row dense>
            <v-col v-for="c in props.managedCommunities" :key="`managed_${c.community_id}`" cols="6" sm="4" md="3">
              <UserProfileCommunityPreviewTile
                :community-name="c.community_name"
                :is-public="c.is_public"
                :icon-url="props.communityIconUrl(c.community_id)"
                :link-to="communityLinkTo(c, props.canLinkToDetail, props.resolveCommunityPath)"
              />
            </v-col>
          </v-row>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
