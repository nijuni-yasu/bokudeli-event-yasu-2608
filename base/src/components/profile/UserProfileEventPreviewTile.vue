<script setup lang="ts">
import { mdiCalendarHeart } from '@mdi/js'
import { formatProfilePreviewDate } from '@shokujii/base/components/profile/userProfileConstants.js'

defineProps<{
  eventName: string
  eventStartDatetime: number
  isPublic: boolean
  communityId: string
  eventId: string
  linkTo: string | undefined
  showCoverImage: boolean
  coverUrl: string | undefined
}>()

const emit = defineEmits<{
  coverError: []
}>()
</script>

<template>
  <component
    :is="linkTo != null ? 'router-link' : 'div'"
    class="preview-event-link d-block"
    :class="{ 'preview-event-link--static': linkTo == null }"
    :to="linkTo"
  >
    <v-card variant="outlined" class="h-100 preview-card overflow-hidden">
      <div class="event-preview-tile">
        <div class="event-preview-tile__cover overflow-hidden">
          <v-img
            v-if="showCoverImage && coverUrl != null"
            :src="coverUrl"
            :alt="eventName"
            cover
            aspect-ratio="1.91"
            @error="emit('coverError')"
          />
          <div
            v-else
            class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
          >
            <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
          </div>
        </div>
        <v-card-text class="pa-3 pt-2">
          <div class="event-preview-tile__meta-row d-flex align-center justify-space-between ga-1 min-width-0">
            <div
              class="profile-preview-tile__meta text-medium-emphasis text-truncate min-width-0"
              :title="formatProfilePreviewDate(eventStartDatetime, 'withWeekday')"
            >
              {{ formatProfilePreviewDate(eventStartDatetime, 'withWeekday') }}
            </div>
            <v-chip
              v-if="!isPublic"
              size="x-small"
              variant="flat"
              class="profile-preview-private-chip flex-shrink-0"
              label
            >
              {{ $t('user_profile.private_event_chip') }}
            </v-chip>
          </div>
          <div class="text-body-2 mt-1 text-truncate" :title="eventName">
            {{ eventName }}
          </div>
        </v-card-text>
      </div>
    </v-card>
  </component>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
