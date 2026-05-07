<script setup lang="ts">
import type { ResolveEventPathFn, ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { getUserFriendMeetLog } from '@shokujii/base/apis/userFriends.js'
import type { UserFriendListItem, UserFriendMeetLogItem } from '@shokujii/common/apis/userFriends.js'
import { User } from '@shokujii/common/schemas/User.js'
import { convertToDatetime } from '@shokujii/common/utils/datetime.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'

const props = defineProps<{
  modelValue: boolean
  targetUserId: string
  targetUserName: string
  isOwner: boolean
  friend: Pick<UserFriendListItem, 'user_id' | 'user_name' | 'user_image_url' | 'meet_count'>
  resolveUserPath: ResolveUserPathFn
  resolveEventPath: ResolveEventPathFn
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t: $t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const friendUser = computed(
  () =>
    new User(props.friend.user_id, {
      user_name: props.friend.user_name,
      user_image_url: props.friend.user_image_url,
    }),
)

const profilePath = computed(() => props.resolveUserPath(props.friend.user_id))
const meetLog = ref<UserFriendMeetLogItem[]>([])
const loading = ref(false)
const loadError = ref(false)

const dialogTitle = computed(() =>
  props.isOwner
    ? $t('user.friend_meet_log_dialog_title', { name: props.friend.user_name })
    : $t('user.friend_meet_log_dialog_title_other', {
        owner: props.targetUserName,
        friend: props.friend.user_name,
      }),
)

const eventCoverUrl = (communityId: string, eventId: string): string | undefined => {
  if (communityId === '' || eventId === '') return undefined
  try {
    return convertStoragePathToURL(getEventCoverStoragePath(communityId, eventId))
  } catch {
    return undefined
  }
}

const isMeetLogEventResolvable = (row: UserFriendMeetLogItem) => row.event_name != null && row.community_account != null

const isEventLinkable = (row: UserFriendMeetLogItem) => isMeetLogEventResolvable(row) && row.is_linkable

const resetState = () => {
  meetLog.value = []
  loading.value = false
  loadError.value = false
}

const loadMeetLog = async () => {
  loading.value = true
  loadError.value = false
  try {
    const response = await getUserFriendMeetLog({
      target_user_id: props.targetUserId,
      friend_user_id: props.friend.user_id,
    })
    meetLog.value = response.data.meet_log
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(isOpen, (open) => {
  if (open) {
    void loadMeetLog()
  } else {
    resetState()
  }
})

const closeDialog = () => {
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="560" scrollable @click:outside="closeDialog">
    <v-card>
      <v-card-item class="pb-2">
        <template #prepend>
          <router-link
            class="friend-meet-log-dialog-profile-link rounded-circle align-self-start"
            :to="profilePath"
            tabindex="0"
            :aria-label="$t('user.friend_profile_link_label', { name: friend.user_name })"
          >
            <UserAvatar :user="friendUser" :size="48" />
          </router-link>
        </template>
        <v-card-title class="text-wrap lh-normal ps-2">
          <router-link
            class="friend-meet-log-dialog-profile-link-text text-reset text-decoration-none"
            :to="profilePath"
          >
            {{ friend.user_name }}
          </router-link>
        </v-card-title>
        <v-card-subtitle class="text-wrap lh-normal ps-2">
          {{ $t('user.friend_meet_count', { count: friend.meet_count }) }}
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="pt-0">
        <div class="text-body-1 font-weight-medium mb-3">
          {{ dialogTitle }}
        </div>

        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="loadError" class="text-body-2 text-medium-emphasis py-4 text-center">
          {{ $t('user.friend_meet_log_load_error') }}
        </div>

        <v-list v-else class="pa-0 meet-log-list list-with-borders" max-height="360" style="overflow-y: auto">
          <v-list-item
            v-for="row in meetLog"
            :key="`${row.community_id}-${row.event_id}`"
            class="meet-log-row"
            :to="isEventLinkable(row) ? resolveEventPath(row.community_account!, row.event_id) : undefined"
            :link="isEventLinkable(row)"
          >
            <template #prepend>
              <v-img
                v-if="isMeetLogEventResolvable(row)"
                :src="eventCoverUrl(row.community_id, row.event_id)"
                width="120"
                aspect-ratio="1.91"
                cover
                rounded="sm"
                class="mr-3 flex-shrink-0"
              />
            </template>
            <v-list-item-title v-if="isMeetLogEventResolvable(row)" class="text-h6 py-1 meet-log-event-title">
              {{ row.event_name }}
            </v-list-item-title>
            <v-list-item-title v-else class="text-body-2 text-medium-emphasis py-1">
              {{ $t('user.friend_meet_log_event_unavailable') }}
            </v-list-item-title>
            <div class="text-body-2">{{ convertToDatetime(row.event_at) }}</div>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="justify-end pb-3 pe-3">
        <v-btn variant="text" @click="closeDialog">{{ $t('user.friend_meet_log_close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.friend-meet-log-dialog-profile-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
  border-radius: 50%;
}

.friend-meet-log-dialog-profile-link-text:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}

.list-with-borders .v-list-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.meet-log-event-title {
  white-space: normal;
  line-height: 1.375;
}
</style>
