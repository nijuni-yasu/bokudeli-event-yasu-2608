<script setup lang="ts">
import { mdiCloseThick, mdiSilverwareForkKnife } from '@mdi/js'
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
  targetUserImageUrl: string
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

const targetUser = computed(
  () =>
    new User(props.targetUserId, {
      user_name: props.targetUserName,
      user_image_url: props.targetUserImageUrl,
    }),
)

const friendUser = computed(
  () =>
    new User(props.friend.user_id, {
      user_name: props.friend.user_name,
      user_image_url: props.friend.user_image_url,
    }),
)

const targetProfilePath = computed(() => props.resolveUserPath(props.targetUserId))
const friendProfilePath = computed(() => props.resolveUserPath(props.friend.user_id))
const meetLog = ref<UserFriendMeetLogItem[]>([])
const loading = ref(false)
const loadError = ref(false)

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
      <v-card-title class="text-h5 font-weight-medium text-center justify-center w-100 px-4 pt-4 pb-0">
        {{ $t('user.friend_meet_log_open') }}
      </v-card-title>

      <div class="px-4 py-2">
        <div class="meet-log-dialog-header-panel rounded-lg pa-5">
          <div class="meet-log-dialog-header">
            <div class="meet-log-dialog-user meet-log-dialog-user--left">
              <router-link
                class="friend-meet-log-dialog-profile-link rounded-circle"
                :to="targetProfilePath"
                tabindex="0"
                :aria-label="$t('user.friend_profile_link_label', { name: targetUserName })"
              >
                <UserAvatar :user="targetUser" :size="56" />
              </router-link>
              <router-link
                class="friend-meet-log-dialog-profile-link-text text-reset text-decoration-none text-body-1 font-weight-medium mt-2 text-center meet-log-dialog-user-name"
                :to="targetProfilePath"
                :title="targetUserName"
              >
                {{ targetUserName }}
              </router-link>
            </div>

            <v-icon
              :icon="mdiCloseThick"
              size="26"
              class="meet-log-dialog-separator text-medium-emphasis"
              aria-hidden="true"
            />

            <div class="meet-log-dialog-user meet-log-dialog-user--right">
              <router-link
                class="friend-meet-log-dialog-profile-link rounded-circle"
                :to="friendProfilePath"
                tabindex="0"
                :aria-label="$t('user.friend_profile_link_label', { name: friend.user_name })"
              >
                <UserAvatar :user="friendUser" :size="56" />
              </router-link>
              <router-link
                class="friend-meet-log-dialog-profile-link-text text-reset text-decoration-none text-body-1 font-weight-medium mt-2 text-center meet-log-dialog-user-name"
                :to="friendProfilePath"
                :title="friend.user_name"
              >
                {{ friend.user_name }}
              </router-link>
            </div>
          </div>

          <div class="d-flex justify-center mt-2">
            <v-chip variant="tonal" :prepend-icon="mdiSilverwareForkKnife" label>
              {{ $t('user.friend_meet_count', { count: friend.meet_count }) }}
            </v-chip>
          </div>
        </div>
      </div>

      <v-card-text class="pt-0">
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
                :alt="row.event_name ?? ''"
                width="120"
                aspect-ratio="1.91"
                cover
                rounded="sm"
                class="mr-3 flex-shrink-0"
              />
            </template>
            <v-list-item-title
              v-if="isMeetLogEventResolvable(row)"
              class="text-body-1 font-weight-medium py-1 meet-log-event-title"
            >
              {{ row.event_name }}
            </v-list-item-title>
            <v-list-item-title v-else class="text-body-2 text-medium-emphasis py-1">
              {{ $t('user.friend_meet_log_event_unavailable') }}
            </v-list-item-title>
            <div class="text-body-2 meet-log-event-date">{{ convertToDatetime(row.event_at) }}</div>
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

.meet-log-dialog-header-panel {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.meet-log-dialog-header {
  display: grid;
  grid-template-columns: max-content auto max-content;
  justify-content: center;
  align-items: start;
  column-gap: 8px;
}

.meet-log-dialog-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 132px;
}

.meet-log-dialog-separator {
  align-self: start;
  margin-top: 15px;
  opacity: 0.72;
}

.meet-log-dialog-user-name {
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  width: 100%;
  overflow: hidden;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.meet-log-list {
  overscroll-behavior: contain;
}

.list-with-borders .v-list-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.meet-log-event-title {
  white-space: normal;
  line-height: 1.375;
}

.meet-log-event-date {
  font-variant-numeric: tabular-nums;
}
</style>
