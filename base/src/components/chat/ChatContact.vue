<script setup lang="ts">
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { avatarText } from '@shokujii/base/utils/avatarText.js'
import { formatChatListTimestamp } from '@shokujii/common/utils/datetime.js'
import type { ChatRoomListItem } from './types.js'

const props = withDefaults(
  defineProps<{
    room: ChatRoomListItem
    active?: boolean
    unreadBadgeColor?: string
  }>(),
  {
    unreadBadgeColor: 'success',
  },
)

const emit = defineEmits<{
  openRoom: [roomId: string]
  openEvent: [payload: { communityId: string; eventId: string }]
}>()

const onOpenRoom = () => {
  emit('openRoom', props.room.roomId)
}

const store = useChatStore()
const { t } = useI18n()

const isActive = computed(() => props.active === true || store.activeRoomId === props.room.roomId)

const unreadLabel = computed(() => {
  if (props.room.unreadCount <= 0) return undefined
  if (props.room.unreadCount > 99) return '99+'
  return String(props.room.unreadCount)
})

const avatarLabel = computed(() => avatarText(props.room.displayTitle))

const canOpenEvent = computed(
  () =>
    props.room.roomType === 'event' &&
    props.room.communityId != null &&
    props.room.eventId != null &&
    props.room.displayTitleReady,
)

const onAvatarClick = (event: MouseEvent) => {
  if (!canOpenEvent.value || props.room.communityId == null || props.room.eventId == null) {
    return
  }
  event.stopPropagation()
  emit('openEvent', { communityId: props.room.communityId, eventId: props.room.eventId })
}
</script>

<template>
  <li
    role="button"
    tabindex="0"
    :aria-label="t('chat.open_room_aria', { name: room.displayTitle })"
    class="chat-contact cursor-pointer d-flex align-center"
    :class="{ 'chat-contact-active': isActive, 'chat-contact-inactive': !room.isActive }"
    @click="onOpenRoom"
    @keydown.enter.prevent="onOpenRoom"
    @keydown.space.prevent="onOpenRoom"
  >
    <VAvatar
      size="40"
      :variant="room.coverImageUrl != null ? 'flat' : 'tonal'"
      :color="room.coverImageUrl != null ? undefined : 'primary'"
      :class="{ 'cursor-pointer': canOpenEvent }"
      @click="onAvatarClick"
    >
      <VImg v-if="room.coverImageUrl != null" :src="room.coverImageUrl" :alt="room.displayTitle" cover />
      <span v-else>{{ avatarLabel }}</span>
    </VAvatar>
    <div class="flex-grow-1 ms-4 overflow-hidden">
      <div class="d-flex align-center gap-2">
        <span class="text-truncate">{{ room.displayTitle }}</span>
        <VChip v-if="!room.isActive" size="x-small" color="secondary" variant="tonal">
          {{ t('chat.ended_label') }}
        </VChip>
      </div>
      <span class="d-block text-sm text-truncate text-medium-emphasis">
        {{ room.lastMessagePreview ?? t('chat.no_messages_yet') }}
      </span>
    </div>
    <div class="d-flex flex-column align-self-start text-end">
      <span v-if="room.lastMessageAt != null" class="d-block text-disabled text-xs whitespace-no-wrap">
        {{ formatChatListTimestamp(room.lastMessageAt) }}
      </span>
      <VBadge v-if="unreadLabel != null" :color="unreadBadgeColor" inline :content="unreadLabel" class="ms-auto" />
    </div>
  </li>
</template>

<style scoped lang="scss">
.chat-contact {
  border-radius: 8px;
  padding-block: 10px;
  padding-inline: 12px;
  list-style: none;
}

.chat-contact-active {
  background: rgba(var(--v-theme-primary), 0.12);
}

.chat-contact-inactive {
  opacity: 0.85;
}
</style>
