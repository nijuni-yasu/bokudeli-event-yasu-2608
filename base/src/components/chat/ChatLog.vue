<script setup lang="ts">
import { mdiDotsVertical } from '@mdi/js'
import { convertToTimeString } from '@shokujii/common/utils/datetime.js'
import { User } from '@shokujii/common/schemas/User.js'
import AlbumLightbox, { type AlbumLightboxSlide } from '@shokujii/base/components/AlbumLightbox.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { getDoc } from 'firebase/firestore'
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { getUserRef } from '@shokujii/base/stores/user.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { CHAT_SYSTEM_EVENT_MEMBER_JOINED } from '@shokujii/common/schemas/ChatMessage.js'
import type { ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import ChatAttachmentImage from './ChatAttachmentImage.vue'
import type { ChatMessageItem } from './types.js'

const props = defineProps<{
  currentUserId: string
  resolveProfilePath?: ResolveUserPathFn
}>()

const store = useChatStore()
const { t } = useI18n()
const notification = useNotification()

const senderNames = ref<Map<string, string>>(new Map())
const senderUsers = ref<Map<string, User | null>>(new Map())
const recallTarget = ref<ChatMessageItem | null>(null)
const showRecallConfirm = ref(false)
const isRecalling = ref(false)
const lightboxVisible = ref(false)
const lightboxImgs = ref<AlbumLightboxSlide[]>([])

const resolveSystemMessage = (message: ChatMessageItem): string => {
  if (message.systemEvent === CHAT_SYSTEM_EVENT_MEMBER_JOINED) {
    const userName = message.systemParams?.user_name ?? t('chat.default_user_name')
    return t('chat.system_member_joined', { name: userName })
  }
  return t('chat.system_message')
}

const resolveDeletedMessage = (message: ChatMessageItem): string => {
  const name = message.deletedDisplayName ?? t('chat.default_user_name')
  return t('chat.system_message_deleted', { name })
}

const resolveSenderName = (senderUserId: string): string => {
  return senderNames.value.get(senderUserId) ?? senderUserId.slice(0, 8)
}

const resolveSenderUser = (senderUserId: string): User | null => {
  return senderUsers.value.get(senderUserId) ?? null
}

const canLinkToProfile = (senderUserId: string): boolean => {
  if (senderUserId === props.currentUserId || props.resolveProfilePath == null) {
    return false
  }
  const user = resolveSenderUser(senderUserId)
  return user == null || !user.is_deleted
}

const profilePath = (senderUserId: string): ReturnType<ResolveUserPathFn> | undefined => {
  if (!canLinkToProfile(senderUserId) || props.resolveProfilePath == null) {
    return undefined
  }
  return props.resolveProfilePath(senderUserId)
}

const profileAriaLabel = (senderUserId: string): string => {
  return t('chat.open_user_profile', { name: resolveSenderName(senderUserId) })
}

const canRecall = (message: ChatMessageItem): boolean => {
  return (
    message.messageType === 'user' &&
    message.senderUserId === props.currentUserId &&
    message.deletedAt == null &&
    store.activeRoom?.isReadonly !== true
  )
}

const openExpandedImage = (payload: { url: string; alt: string }): void => {
  lightboxImgs.value = [{ src: payload.url }]
  lightboxVisible.value = true
}

const onLightboxVisibleUpdate = (value: boolean): void => {
  lightboxVisible.value = value
  if (!value) {
    lightboxImgs.value = []
  }
}

const openRecallConfirm = (message: ChatMessageItem) => {
  recallTarget.value = message
  showRecallConfirm.value = true
}

const confirmRecall = async () => {
  const roomId = store.activeRoomId
  const message = recallTarget.value
  if (roomId == null || message == null) {
    return
  }

  isRecalling.value = true
  try {
    await store.recallMessage(roomId, message.id)
    recallTarget.value = null
  } catch {
    notification.show(t('chat.error.recall_failed'), 'error')
  } finally {
    isRecalling.value = false
  }
}

const collectSenderIds = (messages: ChatMessageItem[]): string[] => {
  const senderIds = new Set<string>()
  for (const message of messages) {
    if (message.messageType === 'user' && message.senderUserId != null) {
      senderIds.add(message.senderUserId)
    }
  }
  return [...senderIds]
}

const fetchSenderProfile = async (senderId: string) => {
  if (senderUsers.value.has(senderId)) {
    return
  }
  senderUsers.value.set(senderId, null)

  try {
    const snapshot = await getDoc(getUserRef(senderId))
    const user = snapshot.exists() ? snapshot.data() : null
    senderUsers.value.set(senderId, user)
    if (user?.user_name != null) {
      senderNames.value.set(senderId, user.user_name)
    }
  } catch {
    senderUsers.value.set(senderId, null)
  }
}

watch(
  () => store.activeRoomId,
  () => {
    senderUsers.value = new Map()
    senderNames.value = new Map()
  },
)

watch(
  () => collectSenderIds(store.messages),
  (senderIds) => {
    for (const senderId of senderIds) {
      void fetchSenderProfile(senderId)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="chat-log pa-5">
    <div v-if="store.isLoadingOlderMessages" class="text-center text-disabled text-sm mb-4">
      {{ t('chat.loading_older') }}
    </div>

    <template v-for="message in store.messages" :key="message.id">
      <div v-if="message.messageType === 'system'" class="text-center text-disabled text-sm my-4">
        {{ resolveSystemMessage(message) }}
      </div>

      <div v-else-if="message.deletedAt != null" class="text-center text-disabled text-sm my-4">
        {{ resolveDeletedMessage(message) }}
      </div>

      <div
        v-else
        class="chat-group d-flex align-start mb-6"
        :class="[message.senderUserId === currentUserId ? 'flex-row-reverse chat-group-own' : '']"
      >
        <component
          :is="profilePath(message.senderUserId ?? '') != null ? 'router-link' : 'div'"
          v-bind="
            profilePath(message.senderUserId ?? '') != null
              ? {
                  to: profilePath(message.senderUserId ?? ''),
                  'aria-label': profileAriaLabel(message.senderUserId ?? ''),
                }
              : {}
          "
          class="flex-shrink-0"
          :class="message.senderUserId === currentUserId ? 'ms-3' : 'me-3'"
          @click.stop
        >
          <UserAvatar :user="resolveSenderUser(message.senderUserId ?? '')" :size="38" />
        </component>

        <div
          class="chat-body d-inline-flex flex-column"
          :class="message.senderUserId === currentUserId ? 'align-end' : 'align-start'"
        >
          <span class="text-xs text-medium-emphasis mb-1">
            {{ resolveSenderName(message.senderUserId ?? '') }}
          </span>
          <div
            class="chat-message-content d-flex flex-column gap-1"
            :class="message.senderUserId === currentUserId ? 'align-end' : 'align-start'"
          >
            <div
              v-if="message.body != null && message.body !== ''"
              class="chat-message-text-row d-flex align-center gap-1"
            >
              <VMenu v-if="canRecall(message)" location="bottom">
                <template #activator="{ props: menuProps }">
                  <VBtn
                    v-bind="menuProps"
                    icon
                    variant="text"
                    size="x-small"
                    color="default"
                    class="chat-recall-menu-btn flex-shrink-0"
                    :aria-label="t('chat.recall_message')"
                    @click.stop
                  >
                    <VIcon :icon="mdiDotsVertical" size="18" />
                  </VBtn>
                </template>
                <VList density="compact">
                  <VListItem :title="t('chat.recall_message')" @click="openRecallConfirm(message)" />
                </VList>
              </VMenu>
              <p
                v-linkify
                class="chat-content py-3 px-4 elevation-1 mb-0"
                :class="
                  message.senderUserId === currentUserId ? 'bg-primary text-white chat-right' : 'bg-surface chat-left'
                "
              >
                {{ message.body }}
              </p>
            </div>
            <div
              v-if="(message.attachments ?? []).length > 0"
              class="chat-message-attachments d-flex align-center gap-1"
            >
              <VMenu v-if="canRecall(message) && (message.body == null || message.body === '')" location="bottom">
                <template #activator="{ props: menuProps }">
                  <VBtn
                    v-bind="menuProps"
                    icon
                    variant="text"
                    size="x-small"
                    color="default"
                    class="chat-recall-menu-btn flex-shrink-0"
                    :aria-label="t('chat.recall_message')"
                    @click.stop
                  >
                    <VIcon :icon="mdiDotsVertical" size="18" />
                  </VBtn>
                </template>
                <VList density="compact">
                  <VListItem :title="t('chat.recall_message')" @click="openRecallConfirm(message)" />
                </VList>
              </VMenu>
              <ChatAttachmentImage
                v-for="attachment in message.attachments ?? []"
                :key="attachment.storage_path"
                :attachment="attachment"
                @expand="openExpandedImage"
              />
            </div>
          </div>
          <span class="text-xs text-disabled">
            {{ convertToTimeString(message.createdAt) }}
          </span>
        </div>
      </div>
    </template>

    <ConfirmDialog
      v-model="showRecallConfirm"
      is-confirm
      :title="t('chat.recall_confirm_title')"
      :ok-text="t('chat.recall_message')"
      :ok-loading-state="isRecalling"
      :cancel-loading-state="isRecalling"
      :ok-click="confirmRecall"
    >
      {{ t('chat.recall_confirm_message') }}
    </ConfirmDialog>

    <AlbumLightbox
      :visible="lightboxVisible"
      :imgs="lightboxImgs"
      :index="0"
      :show-caption="false"
      @update:visible="onLightboxVisibleUpdate"
    />
  </div>
</template>

<style scoped lang="scss">
.chat-group-own {
  .chat-recall-menu-btn {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .chat-recall-menu-btn,
  &:focus-within .chat-recall-menu-btn,
  .chat-recall-menu-btn:focus-visible {
    opacity: 1;
  }
}

@media (hover: none) {
  .chat-group-own .chat-recall-menu-btn {
    opacity: 1;
  }
}

.chat-content {
  font-size: 15px;
  border-end-end-radius: 6px;
  border-end-start-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;

  &.chat-left {
    border-start-end-radius: 6px;
  }

  &.chat-right {
    border-start-start-radius: 6px;

    :deep(a) {
      color: rgb(var(--v-theme-on-primary));
      text-decoration: underline;
    }
  }
}
</style>
