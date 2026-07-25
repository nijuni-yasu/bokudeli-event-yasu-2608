<script setup lang="ts">
import { mdiAccountGroup } from '@mdi/js'
import type { UserProfileCommunityPreviewItem } from '@shokujii/common/apis/userProfile.js'
import type { ProfileCommunityIconUrlFn } from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type {
  ProfileLinkPolicyFn,
  ResolveCommunityPathFn,
} from '@shokujii/base/types/profilePathResolvers.js'

defineProps<{
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
      <v-row v-if="isInitialLoading" dense>
        <v-col v-for="n in 4" :key="`community-skeleton-${n}`" cols="6" sm="4" md="3">
          <v-skeleton-loader type="list-item-avatar-two-line" class="profile-preview-skeleton" />
        </v-col>
      </v-row>
      <div v-else-if="isEmpty" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.empty.communities') }}
      </div>
      <template v-else>
        <template v-if="showJoinedSection">
          <h3 class="profile-community-subsection-title mb-3">
            {{ $t('user_profile.section.joined_communities') }}
          </h3>
          <v-row dense class="mb-6">
            <v-col v-for="c in joinedCommunities" :key="`joined_${c.community_id}`" cols="6" sm="4" md="3">
              <router-link
                v-if="canLinkToDetail(c.is_public, c.is_linkable)"
                class="preview-event-link d-block"
                :to="resolveCommunityPath(c.community_account)"
              >
                <v-card variant="outlined" class="pa-3 h-100 preview-card">
                  <div class="community-preview-tile d-flex align-stretch ga-3">
                    <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                      <v-img
                        v-if="communityIconUrl(c.community_id) != null"
                        :src="communityIconUrl(c.community_id)!"
                        :alt="c.community_name"
                        cover
                      />
                      <v-icon v-else :icon="mdiAccountGroup" />
                    </v-avatar>
                    <div
                      class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                    >
                      <div
                        class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                      >
                        <div
                          class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                          :title="c.community_name"
                        >
                          {{ c.community_name }}
                        </div>
                        <v-chip
                          v-if="!c.is_public"
                          size="x-small"
                          variant="flat"
                          class="profile-preview-private-chip flex-shrink-0"
                          label
                        >
                          {{ $t('user_profile.private_event_chip') }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-card>
              </router-link>
              <div v-else class="preview-event-link preview-event-link--static d-block">
                <v-card variant="outlined" class="pa-3 h-100 preview-card">
                  <div class="community-preview-tile d-flex align-stretch ga-3">
                    <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                      <v-img
                        v-if="communityIconUrl(c.community_id) != null"
                        :src="communityIconUrl(c.community_id)!"
                        :alt="c.community_name"
                        cover
                      />
                      <v-icon v-else :icon="mdiAccountGroup" />
                    </v-avatar>
                    <div
                      class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                    >
                      <div
                        class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                      >
                        <div
                          class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                          :title="c.community_name"
                        >
                          {{ c.community_name }}
                        </div>
                        <v-chip
                          v-if="!c.is_public"
                          size="x-small"
                          variant="flat"
                          class="profile-preview-private-chip flex-shrink-0"
                          label
                        >
                          {{ $t('user_profile.private_event_chip') }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </template>

        <template v-if="showManagedSection">
          <h3 class="profile-community-subsection-title mb-3">
            {{ $t('user_profile.section.managed_communities') }}
          </h3>
          <v-row dense>
            <v-col v-for="c in managedCommunities" :key="`managed_${c.community_id}`" cols="6" sm="4" md="3">
              <router-link
                v-if="canLinkToDetail(c.is_public, c.is_linkable)"
                class="preview-event-link d-block"
                :to="resolveCommunityPath(c.community_account)"
              >
                <v-card variant="outlined" class="pa-3 h-100 preview-card">
                  <div class="community-preview-tile d-flex align-stretch ga-3">
                    <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                      <v-img
                        v-if="communityIconUrl(c.community_id) != null"
                        :src="communityIconUrl(c.community_id)!"
                        :alt="c.community_name"
                        cover
                      />
                      <v-icon v-else :icon="mdiAccountGroup" />
                    </v-avatar>
                    <div
                      class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                    >
                      <div
                        class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                      >
                        <div
                          class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                          :title="c.community_name"
                        >
                          {{ c.community_name }}
                        </div>
                        <v-chip
                          v-if="!c.is_public"
                          size="x-small"
                          variant="flat"
                          class="profile-preview-private-chip flex-shrink-0"
                          label
                        >
                          {{ $t('user_profile.private_event_chip') }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-card>
              </router-link>
              <div v-else class="preview-event-link preview-event-link--static d-block">
                <v-card variant="outlined" class="pa-3 h-100 preview-card">
                  <div class="community-preview-tile d-flex align-stretch ga-3">
                    <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                      <v-img
                        v-if="communityIconUrl(c.community_id) != null"
                        :src="communityIconUrl(c.community_id)!"
                        :alt="c.community_name"
                        cover
                      />
                      <v-icon v-else :icon="mdiAccountGroup" />
                    </v-avatar>
                    <div
                      class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                    >
                      <div
                        class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                      >
                        <div
                          class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                          :title="c.community_name"
                        >
                          {{ c.community_name }}
                        </div>
                        <v-chip
                          v-if="!c.is_public"
                          size="x-small"
                          variant="flat"
                          class="profile-preview-private-chip flex-shrink-0"
                          label
                        >
                          {{ $t('user_profile.private_event_chip') }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
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
