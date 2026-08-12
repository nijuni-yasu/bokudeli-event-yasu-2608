<script setup lang="ts">
import { mdiAccountGroup } from '@mdi/js'

defineProps<{
  communityName: string
  isPublic: boolean
  iconUrl: string | undefined
  linkTo: string | undefined
}>()
</script>

<template>
  <component
    :is="linkTo != null ? 'router-link' : 'div'"
    class="preview-event-link d-block"
    :class="{ 'preview-event-link--static': linkTo == null }"
    :to="linkTo"
  >
    <v-card variant="outlined" class="pa-3 h-100 preview-card">
      <div class="community-preview-tile d-flex align-stretch ga-3">
        <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
          <v-img v-if="iconUrl != null" :src="iconUrl" :alt="communityName" cover />
          <v-icon v-else :icon="mdiAccountGroup" />
        </v-avatar>
        <div class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center">
          <div class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0">
            <div class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1" :title="communityName">
              {{ communityName }}
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
        </div>
      </div>
    </v-card>
  </component>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
