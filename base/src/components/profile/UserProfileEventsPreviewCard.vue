<script setup lang="ts">
import { mdiCalendarHeart } from '@mdi/js'
import type { UserProfileEventPreviewItem } from '@shokujii/common/apis/userProfile.js'
import { formatProfilePreviewDate } from '@shokujii/base/components/profile/userProfileConstants.js'
import type {
  ProfileEventCoverUrlFn,
  ProfileOnEventCoverErrorFn,
  ProfileShowEventCoverImageFn,
} from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ProfileLinkPolicyFn, ResolveEventPathFn } from '@shokujii/base/types/profilePathResolvers.js'

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
          <router-link
            v-if="canLinkToDetail(event.is_public, event.is_linkable)"
            class="preview-event-link d-block"
            :to="resolveEventPath(event.community_account, event.event_id)"
          >
            <v-card variant="outlined" class="h-100 preview-card overflow-hidden">
              <div class="event-preview-tile">
                <div class="event-preview-tile__cover overflow-hidden">
                  <v-img
                    v-if="showEventCoverImage(event.community_id, event.event_id)"
                    :src="eventCoverUrl(event.community_id, event.event_id)"
                    :alt="event.event_name"
                    cover
                    aspect-ratio="1.91"
                    @error="onEventCoverError(event.community_id, event.event_id)"
                  />
                  <div
                    v-else
                    class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
                  >
                    <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
                  </div>
                </div>
                <v-card-text class="pa-3 pt-2">
                  <div
                    class="event-preview-tile__meta-row d-flex align-center justify-space-between ga-1 min-width-0"
                  >
                    <div
                      class="profile-preview-tile__meta text-medium-emphasis text-truncate min-width-0"
                      :title="formatProfilePreviewDate(event.event_start_datetime, 'withWeekday')"
                    >
                      {{ formatProfilePreviewDate(event.event_start_datetime, 'withWeekday') }}
                    </div>
                    <v-chip
                      v-if="!event.is_public"
                      size="x-small"
                      variant="flat"
                      class="profile-preview-private-chip flex-shrink-0"
                      label
                    >
                      {{ $t('user_profile.private_event_chip') }}
                    </v-chip>
                  </div>
                  <div class="text-body-2 mt-1 text-truncate" :title="event.event_name">
                    {{ event.event_name }}
                  </div>
                </v-card-text>
              </div>
            </v-card>
          </router-link>
          <div v-else class="preview-event-link preview-event-link--static d-block">
            <v-card variant="outlined" class="h-100 preview-card overflow-hidden">
              <div class="event-preview-tile">
                <div class="event-preview-tile__cover overflow-hidden">
                  <v-img
                    v-if="showEventCoverImage(event.community_id, event.event_id)"
                    :src="eventCoverUrl(event.community_id, event.event_id)"
                    :alt="event.event_name"
                    cover
                    aspect-ratio="1.91"
                    @error="onEventCoverError(event.community_id, event.event_id)"
                  />
                  <div
                    v-else
                    class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
                  >
                    <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
                  </div>
                </div>
                <v-card-text class="pa-3 pt-2">
                  <div
                    class="event-preview-tile__meta-row d-flex align-center justify-space-between ga-1 min-width-0"
                  >
                    <div
                      class="profile-preview-tile__meta text-medium-emphasis text-truncate min-width-0"
                      :title="formatProfilePreviewDate(event.event_start_datetime, 'withWeekday')"
                    >
                      {{ formatProfilePreviewDate(event.event_start_datetime, 'withWeekday') }}
                    </div>
                    <v-chip
                      v-if="!event.is_public"
                      size="x-small"
                      variant="flat"
                      class="profile-preview-private-chip flex-shrink-0"
                      label
                    >
                      {{ $t('user_profile.private_event_chip') }}
                    </v-chip>
                  </div>
                  <div class="text-body-2 mt-1 text-truncate" :title="event.event_name">
                    {{ event.event_name }}
                  </div>
                </v-card-text>
              </div>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
