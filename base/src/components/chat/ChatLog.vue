<script setup lang="ts">
import { mdiDotsVertical } from '@mdi/js'
import {
  convertToTimeString,
  convertToDateString,
  formatChatCalendarDate,
  isChatSameCalendarDay,
  isChatToday,
  isChatYesterday,
} from '@shokujii/common/utils/datetime.js'
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
import { getChatAttachmentBlob } from '@shokujii/base/utils/storage.js'
import ChatAttachmentImage from './ChatAttachmentImage.vue'
import { injectionKeyChatAttachmentLightboxPin } from './symbols.js'

import type { ChatMessageItem } from './types.js'

type ChatLogEntry =
  | { kind: 'date-separator'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessageItem }

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
const lightboxIndex = ref(0)
/** サムネ読込済み Object URL（storage_path → url）。ライトボックスで再利用する */
const attachmentObjectUrlByPath = ref(new Map<string, string>())
/** ライトボックス用に ChatLog が生成した Object URL（サムネ側の URL は含めない） */
const lightboxOwnedObjectUrls = ref<string[]>([])
const attachmentLightboxPinActive = ref(false)

provide(injectionKeyChatAttachmentLightboxPin, attachmentLightboxPinActive)

const onAttachmentLoaded = ({ storagePath, url }: { storagePath: string; url: string }): void => {
  const prev = attachmentObjectUrlByPath.value.get(storagePath)
  if (prev != null && prev !== url) {
    URL.revokeObjectURL(prev)
  }
  attachmentObjectUrlByPath.value.set(storagePath, url)
}

const onAttachmentUnloaded = ({ storagePath }: { storagePath: string }): void => {
  const url = attachmentObjectUrlByPath.value.get(storagePath)
  if (url != null) {
    URL.revokeObjectURL(url)
  }
  attachmentObjectUrlByPath.value.delete(storagePath)
}

const revokeAllAttachmentObjectUrls = (): void => {
  for (const url of attachmentObjectUrlByPath.value.values()) {
    URL.revokeObjectURL(url)
  }
  attachmentObjectUrlByPath.value.clear()
}

const revokeLightboxOwnedUrls = (): void => {
  for (const url of lightboxOwnedObjectUrls.value) {
    URL.revokeObjectURL(url)
  }
  lightboxOwnedObjectUrls.value = []
}

const resolveAttachmentObjectUrl = (
  storagePath: string,
  clickedStoragePath: string,
  clickedUrl: string,
): string | undefined => {
  if (storagePath === clickedStoragePath) {
    return clickedUrl
  }
  return attachmentObjectUrlByPath.value.get(storagePath)
}

const fetchPendingLightboxSlides = async (
  pending: { slideIndex: number; storagePath: string; fileName: string }[],
): Promise<void> => {
  await Promise.all(
    pending.map(async ({ slideIndex, storagePath, fileName }) => {
      try {
        const blob = await getChatAttachmentBlob(storagePath)
        const url = URL.createObjectURL(blob)
        if (!lightboxVisible.value) {
          URL.revokeObjectURL(url)
          return
        }
        lightboxOwnedObjectUrls.value.push(url)
        onAttachmentLoaded({ storagePath, url })
        const slide = lightboxImgs.value[slideIndex]
        if (slide != null) {
          lightboxImgs.value[slideIndex] = { src: url, title: fileName }
        }
      } catch {
        // 読み込み失敗分は空スライドのまま
      }
    }),
  )
}

const openExpandedImage = (
  message: ChatMessageItem,
  clickedStoragePath: string,
  payload: { url: string; alt: string },
): void => {
  revokeLightboxOwnedUrls()

  const attachments = message.attachments ?? []

  if (attachments.length <= 1) {
    lightboxImgs.value = [{ src: payload.url, title: payload.alt }]
    lightboxIndex.value = 0
    attachmentLightboxPinActive.value = true
    lightboxVisible.value = true
    return
  }

  const slides: AlbumLightboxSlide[] = []
  const pendingFetches: { slideIndex: number; storagePath: string; fileName: string }[] = []
  let clickedSlideIndex = 0

  for (const attachment of attachments) {
    const url = resolveAttachmentObjectUrl(attachment.storage_path, clickedStoragePath, payload.url)
    const slideIndex = slides.length
    if (attachment.storage_path === clickedStoragePath) {
      clickedSlideIndex = slideIndex
    }
    if (url != null) {
      slides.push({ src: url, title: attachment.file_name })
    } else {
      slides.push({ src: '', title: attachment.file_name })
      pendingFetches.push({ slideIndex, storagePath: attachment.storage_path, fileName: attachment.file_name })
    }
  }

  lightboxImgs.value = slides
  lightboxIndex.value = clickedSlideIndex
  attachmentLightboxPinActive.value = true
  lightboxVisible.value = true

  if (pendingFetches.length > 0) {
    void fetchPendingLightboxSlides(pendingFetches)
  }
}

const onLightboxVisibleUpdate = (value: boolean): void => {
  lightboxVisible.value = value
  if (!value) {
    attachmentLightboxPinActive.value = false
    revokeLightboxOwnedUrls()
    lightboxImgs.value = []
    lightboxIndex.value = 0
  }
}

onBeforeUnmount(() => {
  attachmentLightboxPinActive.value = false
  for (const url of attachmentObjectUrlByPath.value.values()) {
    URL.revokeObjectURL(url)
  }
  attachmentObjectUrlByPath.value.clear()
  revokeLightboxOwnedUrls()
})

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
    lightboxVisible.value = false
    attachmentLightboxPinActive.value = false
    revokeLightboxOwnedUrls()
    revokeAllAttachmentObjectUrls()
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

const resolveDateSeparatorLabel = (createdAt: number): string => {
  if (isChatToday(createdAt)) {
    return t('chat.date_today')
  }
  if (isChatYesterday(createdAt)) {
    return t('chat.date_yesterday')
  }
  return formatChatCalendarDate(createdAt)
}

const chatLogEntries = computed((): ChatLogEntry[] => {
  const entries: ChatLogEntry[] = []
  let previousCreatedAt: number | null = null

  for (const message of store.messages) {
    if (previousCreatedAt == null || !isChatSameCalendarDay(previousCreatedAt, message.createdAt)) {
      entries.push({
        kind: 'date-separator',
        key: `date-${convertToDateString(message.createdAt)}`,
        label: resolveDateSeparatorLabel(message.createdAt),
      })
    }
    entries.push({
      kind: 'message',
      key: message.id,
      message,
    })
    previousCreatedAt = message.createdAt
  }

  return entries
})

const showEmptyMessagesHint = computed(() => {
  return store.messages.length === 0 && !store.isLoadingOlderMessages
})

onBeforeUnmount(() => {
  revokeLightboxOwnedUrls()
})
</script>

<template>
  <div class="chat-log">
    <div v-if="store.isLoadingOlderMessages" class="text-center text-disabled text-sm mb-4">
      {{ t('chat.loading_older') }}
    </div>

    <div v-else-if="showEmptyMessagesHint" class="text-center text-disabled text-sm my-4">
      <p class="mb-0">{{ t('chat.no_messages_yet') }}</p>
      <p class="mb-0">{{ t('chat.empty.no_messages_hint') }}</p>
    </div>

    <template v-for="entry in chatLogEntries" :key="entry.key">
      <div v-if="entry.kind === 'date-separator'" class="text-center text-disabled text-sm my-4">
        {{ entry.label }}
      </div>

      <template v-else>
        <div v-if="entry.message.messageType === 'system'" class="text-center text-disabled text-sm my-4">
          {{ resolveSystemMessage(entry.message) }}
        </div>

        <div v-else-if="entry.message.deletedAt != null" class="text-center text-disabled text-sm my-4">
          {{ resolveDeletedMessage(entry.message) }}
        </div>

        <div
          v-else
          class="chat-group d-flex align-start mb-6"
          :class="[entry.message.senderUserId === currentUserId ? 'flex-row-reverse chat-group-own' : '']"
        >
          <component
            v-if="entry.message.senderUserId !== currentUserId"
            :is="profilePath(entry.message.senderUserId ?? '') != null ? 'router-link' : 'div'"
            v-bind="
              profilePath(entry.message.senderUserId ?? '') != null
                ? {
                    to: profilePath(entry.message.senderUserId ?? ''),
                    'aria-label': profileAriaLabel(entry.message.senderUserId ?? ''),
                  }
                : {}
            "
            class="flex-shrink-0 me-3"
            @click.stop
          >
            <UserAvatar :user="resolveSenderUser(entry.message.senderUserId ?? '')" :size="38" />
          </component>

          <div
            class="chat-body d-inline-flex flex-column gap-1"
            :class="entry.message.senderUserId === currentUserId ? 'align-end' : 'align-start'"
          >
            <span v-if="entry.message.senderUserId !== currentUserId" class="text-xs text-medium-emphasis">
              {{ resolveSenderName(entry.message.senderUserId ?? '') }}
            </span>
            <div
              class="chat-message-content d-flex flex-column gap-1"
              :class="entry.message.senderUserId === currentUserId ? 'align-end' : 'align-start'"
            >
              <div
                v-if="entry.message.body != null && entry.message.body !== ''"
                class="chat-message-text-row d-flex align-center gap-1"
              >
                <VMenu v-if="canRecall(entry.message)" location="bottom">
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
                    <VListItem :title="t('chat.recall_message')" @click="openRecallConfirm(entry.message)" />
                  </VList>
                </VMenu>
                <p
                  v-linkify
                  class="chat-content py-3 px-4 elevation-1 mb-0"
                  :class="
                    entry.message.senderUserId === currentUserId
                      ? 'bg-primary text-white chat-right'
                      : 'bg-surface chat-left'
                  "
                >
                  {{ entry.message.body }}
                </p>
              </div>
              <div
                v-if="(entry.message.attachments ?? []).length > 0"
                class="chat-message-attachments-row d-flex align-center gap-1"
              >
                <VMenu
                  v-if="canRecall(entry.message) && (entry.message.body == null || entry.message.body === '')"
                  location="bottom"
                >
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
                    <VListItem :title="t('chat.recall_message')" @click="openRecallConfirm(entry.message)" />
                  </VList>
                </VMenu>
                <div
                  class="chat-message-attachments"
                  :class="{
                    'chat-message-attachments--single': (entry.message.attachments ?? []).length === 1,
                    'chat-message-attachments--pair': (entry.message.attachments ?? []).length === 2,
                  }"
                >
                  <ChatAttachmentImage
                    v-for="attachment in entry.message.attachments ?? []"
                    :key="attachment.storage_path"
                    :attachment="attachment"
                    :layout="(entry.message.attachments ?? []).length === 1 ? 'fluid' : 'tile'"
                    @loaded="onAttachmentLoaded"
                    @unloaded="onAttachmentUnloaded"
                    @expand="(payload) => openExpandedImage(entry.message, attachment.storage_path, payload)"
                  />
                </div>
              </div>
            </div>
            <span class="text-xs text-disabled">
              {{ convertToTimeString(entry.message.createdAt) }}
            </span>
          </div>
        </div>
      </template>
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
      :index="lightboxIndex"
      :show-caption="false"
      :show-counter="false"
      @update:visible="onLightboxVisibleUpdate"
    />
  </div>
</template>

<style scoped lang="scss">
.chat-log {
  container-type: inline-size;
  container-name: chat-log;
  padding: 12px;

  @media (min-width: 600px) {
    padding: 20px;
  }
}

.chat-body {
  max-inline-size: 100%;
}

.chat-message-content {
  max-inline-size: 100%;
}

.chat-message-attachments-row {
  max-inline-size: 100%;
}

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

.chat-message-attachments {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  inline-size: 248px;
  max-inline-size: 248px;
  flex-shrink: 0;
}

.chat-message-attachments--single {
  display: block;
  inline-size: fit-content;
  max-inline-size: 240px;
}

@media (min-width: 600px) {
  @container chat-log (min-width: 380px) {
    .chat-message-attachments {
      grid-template-columns: repeat(3, 1fr);
      inline-size: 372px;
      max-inline-size: 372px;
    }

    .chat-message-attachments--single {
      inline-size: fit-content;
      max-inline-size: 240px;
    }

    .chat-message-attachments--pair {
      grid-template-columns: repeat(2, 1fr);
      inline-size: 248px;
      max-inline-size: 248px;
    }
  }
}
</style>
