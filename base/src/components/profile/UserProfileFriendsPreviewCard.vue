<script setup lang="ts">
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { mdiHeartOutline } from '@mdi/js'
import { User } from '@shokujii/common/schemas/User.js'
import type { UserProfileFriendPreviewItem } from '@shokujii/common/apis/userProfile.js'
import type { ProfileCanLinkFriendPreviewFn } from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'

const props = withDefaults(
  defineProps<{
    friends: UserProfileFriendPreviewItem[]
    isInitialLoading: boolean
    loading: boolean
    showEmpty: boolean
    hasMore: boolean
    loadedCount: number
    totalCount: number
    avatarSize: number
    resolveUserPath: ResolveUserPathFn
    canLinkFriendPreview?: ProfileCanLinkFriendPreviewFn
  }>(),
  {
    canLinkFriendPreview: () => true,
  },
)

const emit = defineEmits<{
  showMore: []
  loadMore: []
}>()

const friendUserOf = (item: { user_id: string; user_name: string; user_image_url: string }) =>
  new User(item.user_id, { user_name: item.user_name, user_image_url: item.user_image_url })

const canLink = (friend: UserProfileFriendPreviewItem) => props.canLinkFriendPreview?.(friend) ?? true
</script>

<template>
  <v-card elevation="2" class="profile-panel-card mb-4">
    <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
      <v-icon :icon="mdiHeartOutline" size="18" class="profile-section-title__icon text-medium-emphasis me-1" />
      <span class="profile-section-title">{{ $t('user_profile.section.friends') }}</span>
      <v-spacer />
      <v-btn variant="text" size="small" @click="emit('showMore')">{{ $t('user_profile.show_more') }}</v-btn>
    </v-card-title>
    <v-card-text class="pt-0">
      <div
        v-if="isInitialLoading || (loading && friends.length === 0)"
        class="profile-friends-preview d-flex flex-wrap ga-2 align-center"
      >
        <v-skeleton-loader
          v-for="n in 8"
          :key="`friend-skeleton-${n}`"
          type="avatar"
          class="profile-friend-preview-skeleton flex-shrink-0"
        />
      </div>
      <div v-else-if="showEmpty" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.empty.friends') }}
      </div>
      <div v-if="friends.length > 0" class="profile-friends-preview d-flex flex-wrap ga-2 align-center">
        <template v-for="friend in friends" :key="friend.user_id">
          <router-link
            v-if="canLink(friend)"
            class="profile-friends-preview-link text-decoration-none flex-shrink-0"
            :to="resolveUserPath(friend.user_id)"
            :aria-label="friend.user_name"
          >
            <UserAvatar :user="friendUserOf(friend)" :size="avatarSize" />
          </router-link>
          <span v-else class="profile-friends-preview-link flex-shrink-0 d-inline-flex" :aria-label="friend.user_name">
            <UserAvatar :user="friendUserOf(friend)" :size="avatarSize" />
          </span>
        </template>
      </div>
      <div v-if="!isInitialLoading && (hasMore || friends.length > 0)" class="d-flex justify-center mt-3">
        <IncrementalLoader :loaded-count="loadedCount" :total-count="totalCount" @load="emit('loadMore')" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
