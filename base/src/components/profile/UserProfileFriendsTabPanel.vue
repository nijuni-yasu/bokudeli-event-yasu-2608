<script setup lang="ts">
import FriendCard from '@shokujii/base/components/FriendCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import type { UserFriendsStore } from '@shokujii/base/stores/userFriends.js'
import type { ResolveEventPathFn, ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import type { UserFriendListItem, UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'

withDefaults(
  defineProps<{
    friendSortItems: Array<{ title: string; value: UserFriendsSortBy }>
    showSortToggle: boolean
    sortUi?: 'select' | 'toggle'
    activeFriends: UserFriendListItem[]
    activeUserFriendsStore?: UserFriendsStore | null
    profileUserId: string
    targetUserName: string
    targetUserImageUrl: string
    isOwner: boolean
    resolveUserPath: ResolveUserPathFn
    resolveEventPath: ResolveEventPathFn
  }>(),
  {
    sortUi: 'select',
  },
)

const friendSortBy = defineModel<UserFriendsSortBy>({ required: true })

const { t: $t } = useI18n()
</script>

<template>
  <div v-if="showSortToggle && sortUi === 'select'" class="d-flex justify-end mb-3">
    <v-select
      v-model="friendSortBy"
      :items="friendSortItems"
      item-title="title"
      item-value="value"
      density="compact"
      variant="outlined"
      hide-details
      :label="$t('user.friend_sort_aria_label')"
      class="friend-sort-select"
    />
  </div>
  <v-row v-if="showSortToggle && sortUi === 'toggle'" class="align-center mb-2">
    <v-col cols="12" sm="4">
      <v-btn-toggle
        v-model="friendSortBy"
        mandatory
        color="primary"
        density="comfortable"
        divided
        class="friend-sort-toggle w-100"
      >
        <v-btn value="meet_count">{{ $t('user.friend_sort_meet_count') }}</v-btn>
        <v-btn value="last_met_at">{{ $t('user.friend_sort_last_met_at') }}</v-btn>
      </v-btn-toggle>
    </v-col>
  </v-row>
  <v-row v-if="activeFriends.length > 0">
    <v-col v-for="friend in activeFriends" :key="friend.user_id" cols="12" sm="6" md="4">
      <FriendCard
        :friend="friend"
        :target-user-id="profileUserId"
        :target-user-name="targetUserName"
        :target-user-image-url="targetUserImageUrl"
        :resolve-user-path="resolveUserPath"
        :resolve-event-path="resolveEventPath"
      />
    </v-col>
  </v-row>
  <div v-else-if="!activeUserFriendsStore?.loading" class="text-body-1 text-medium-emphasis pa-4">
    {{ isOwner ? $t('user.friend_empty_tab') : $t('user.friend_empty_other', { name: targetUserName }) }}
  </div>
  <v-row class="justify-center">
    <v-col cols="auto">
      <IncrementalLoader
        :loaded-count="activeFriends.length"
        :total-count="activeUserFriendsStore?.hasMore ? Number.MAX_SAFE_INTEGER : activeFriends.length"
        @load="activeUserFriendsStore?.next()"
      />
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
