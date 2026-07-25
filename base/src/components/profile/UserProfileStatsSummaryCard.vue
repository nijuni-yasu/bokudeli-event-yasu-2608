<script setup lang="ts">
import {
  statTabForKey,
  type UserProfileStatKey,
  type UserProfileStatRow,
  type UserProfileTabKey,
} from '@shokujii/base/components/profile/userProfileConstants.js'

defineProps<{
  statRows: UserProfileStatRow[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  goToTab: [tab: UserProfileTabKey]
}>()

const onStatClick = (key: UserProfileStatKey) => {
  emit('goToTab', statTabForKey(key))
}
</script>

<template>
  <v-card elevation="2" class="profile-panel-card mb-4">
    <v-card-text class="pa-4 pa-sm-5">
      <div class="profile-stats-summary">
        <div v-for="row in statRows" :key="row.key" class="profile-stats-item text-center">
          <div class="text-body-2 text-medium-emphasis">{{ row.label }}</div>
          <v-skeleton-loader v-if="isLoading" type="text" class="profile-stat-skeleton mx-auto mt-1" />
          <button
            v-else
            type="button"
            class="profile-stat-value text-h3 font-weight-medium mt-1"
            :aria-label="$t('user_profile.stat_view_detail', { label: row.label })"
            @click="onStatClick(row.key)"
          >
            {{ row.value }}
          </button>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
