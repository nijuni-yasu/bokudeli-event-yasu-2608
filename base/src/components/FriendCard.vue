<script setup lang="ts">
import { mdiHistory, mdiSilverwareForkKnife } from '@mdi/js'
import type { ResolveEventPathFn, ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import FriendMeetLogDialog from '@shokujii/base/components/FriendMeetLogDialog.vue'
import type { UserFriendListItem } from '@shokujii/common/apis/userFriends.js'
import { User } from '@shokujii/common/schemas/User.js'
import { convertToDate } from '@shokujii/common/utils/datetime.js'

const props = defineProps<{
  friend: UserFriendListItem
  targetUserId: string
  targetUserName: string
  targetUserImageUrl: string
  resolveUserPath: ResolveUserPathFn
  resolveEventPath: ResolveEventPathFn
}>()

const { t: $t } = useI18n()

const friendUser = computed(
  () =>
    new User(props.friend.user_id, {
      user_name: props.friend.user_name,
      user_image_url: props.friend.user_image_url,
    }),
)

const profilePath = computed(() => props.resolveUserPath(props.friend.user_id))
const hasMeetHistory = computed(() => props.friend.meet_count > 0)
const meetLogDialogOpen = ref(false)

const isSingleMeet = computed(
  () => props.friend.meet_count <= 1 || props.friend.first_met_at === props.friend.last_met_at,
)

const openMeetLogDialog = () => {
  meetLogDialogOpen.value = true
}
</script>

<template>
  <v-card class="friend-card h-100 d-flex flex-column">
    <v-card-item class="friend-card-item pb-2">
      <template #prepend>
        <router-link
          class="friend-card-profile-link rounded-circle align-self-start"
          :to="profilePath"
          tabindex="0"
          :aria-label="$t('user.friend_profile_link_label', { name: friend.user_name })"
        >
          <UserAvatar :user="friendUser" :size="56" />
        </router-link>
      </template>

      <div class="friend-card-header ps-2 min-w-0">
        <v-card-title class="friend-card-title lh-normal pa-0">
          <router-link
            class="friend-card-profile-link-text text-reset text-decoration-none"
            :to="profilePath"
            :title="friend.user_name"
          >
            {{ friend.user_name }}
          </router-link>
        </v-card-title>

        <v-chip
          size="small"
          variant="tonal"
          class="friend-meet-count-chip mt-2"
          :prepend-icon="mdiSilverwareForkKnife"
          label
        >
          <span class="friend-meet-count-value">{{ $t('user.friend_meet_count', { count: friend.meet_count }) }}</span>
        </v-chip>
      </div>
    </v-card-item>

    <v-card-text class="pt-0 flex-grow-1 d-flex flex-column ga-1">
      <div v-if="isSingleMeet && friend.last_met_at > 0" class="friend-date-primary text-body-2">
        <span class="text-medium-emphasis">{{ $t('user.friend_first_met_at') }}</span>
        <span class="ms-1 friend-date-value">{{ convertToDate(friend.last_met_at) }}</span>
      </div>

      <template v-else>
        <div v-if="friend.last_met_at > 0" class="friend-date-primary text-body-2">
          <span class="text-medium-emphasis">{{ $t('user.friend_last_met_at') }}</span>
          <span class="ms-1 friend-date-value">{{ convertToDate(friend.last_met_at) }}</span>
        </div>

        <div v-if="friend.first_met_at > 0" class="friend-date-secondary text-caption text-medium-emphasis">
          <span>{{ $t('user.friend_first_met_at') }}</span>
          <span class="ms-1 friend-date-value">{{ convertToDate(friend.first_met_at) }}</span>
        </div>
      </template>
    </v-card-text>

    <v-card-actions v-if="hasMeetHistory" class="pt-0 pb-2 pe-2 justify-end">
      <v-btn
        variant="outlined"
        rounded="pill"
        color="primary"
        density="comfortable"
        size="small"
        class="meet-log-open-btn"
        @click="openMeetLogDialog"
      >
        {{ $t('user.friend_meet_log_open') }}
        <v-icon end :icon="mdiHistory" aria-hidden="true" />
      </v-btn>
    </v-card-actions>

    <FriendMeetLogDialog
      v-model="meetLogDialogOpen"
      :target-user-id="targetUserId"
      :target-user-name="targetUserName"
      :target-user-image-url="targetUserImageUrl"
      :friend="friend"
      :resolve-user-path="resolveUserPath"
      :resolve-event-path="resolveEventPath"
    />
  </v-card>
</template>

<style scoped lang="scss">
.friend-card {
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;

  @media (hover: hover) {
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}

.friend-card-item {
  align-items: flex-start;
}

.friend-card-header {
  min-width: 0;
}

.friend-card-title {
  min-width: 0;
}

.friend-card-profile-link-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}

.friend-card-profile-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
  border-radius: 50%;
}

.friend-card-profile-link-text:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}

.friend-date-primary,
.friend-date-secondary {
  line-height: 1.5;
}

.friend-date-value {
  font-variant-numeric: tabular-nums;
}

.friend-meet-count-chip {
  max-width: 100%;
}

.friend-meet-count-value {
  font-variant-numeric: tabular-nums;
}

.meet-log-open-btn {
  text-transform: none;
  letter-spacing: normal;
}
</style>
