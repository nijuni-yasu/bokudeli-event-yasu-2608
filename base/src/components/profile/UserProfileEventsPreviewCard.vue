<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { mdiCalendarHeart } from '@mdi/js'
import type { UserProfileEventPreviewItem } from '@shokujii/common/apis/userProfile.js'
import type {
  ProfileEventCoverUrlFn,
  ProfileOnEventCoverErrorFn,
  ProfileShowEventCoverImageFn,
} from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ProfileLinkPolicyFn, ResolveEventPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import UserProfileEventPreviewTile from '@shokujii/base/components/profile/UserProfileEventPreviewTile.vue'

defineProps<{
  events: UserProfileEventPreviewItem[]
  isInitialLoading: boolean
  canLinkToDetail: ProfileLinkPolicyFn
  resolveEventPath: ResolveEventPathFn
  eventCoverUrl: ProfileEventCoverUrlFn
  showEventCoverImage: ProfileShowEventCoverImageFn
  onEventCoverError: ProfileOnEventCoverErrorFn
}>()

const emit = defineEmits<{
  showMore: []
}>()

const eventLinkTo = (
  event: UserProfileEventPreviewItem,
  canLinkToDetail: ProfileLinkPolicyFn,
  resolveEventPath: ResolveEventPathFn,
): RouteLocationRaw | undefined =>
  canLinkToDetail(event.is_public, event.is_linkable)
    ? resolveEventPath(event.community_account, event.event_id)
    : undefined
</script>

<template>
  <v-card elevation="2" class="profile-panel-card mb-4">
    <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
      <v-icon :icon="mdiCalendarHeart" size="18" class="profile-section-title__icon text-medium-emphasis me-1" />
      <span class="profile-section-title">{{ $t('user_profile.section.events') }}</span>
      <v-spacer />
      <v-btn variant="text" size="small" @click="emit('showMore')">{{ $t('user_profile.show_more') }}</v-btn>
    </v-card-title>
    <v-card-text class="pt-0">
      <v-row v-if="isInitialLoading" dense>
        <v-col v-for="n in 4" :key="`event-skeleton-${n}`" cols="6" sm="4" md="3">
          <v-skeleton-loader type="image, text@2" class="profile-preview-skeleton" />
        </v-col>
      </v-row>
      <div v-else-if="events.length === 0" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.empty.events') }}
      </div>
      <v-row v-else dense>
        <v-col v-for="event in events" :key="event.event_id" cols="6" sm="4" md="3">
          <UserProfileEventPreviewTile
            :event-name="event.event_name"
            :event-start-datetime="event.event_start_datetime"
            :is-public="event.is_public"
            :link-to="eventLinkTo(event, canLinkToDetail, resolveEventPath)"
            :show-cover-image="showEventCoverImage(event.community_id, event.event_id)"
            :cover-url="eventCoverUrl(event.community_id, event.event_id)"
            @cover-error="onEventCoverError(event.community_id, event.event_id)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
