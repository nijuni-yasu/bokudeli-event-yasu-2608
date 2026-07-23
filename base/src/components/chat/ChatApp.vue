<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { mdiClose, mdiImageOutline, mdiMenu, mdiMessageOutline, mdiPlus, mdiSend } from '@mdi/js'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useDisplay } from 'vuetify'
import { useResponsiveLeftSidebar } from '@shokujii/base/composable/useResponsiveSidebar.js'
import { avatarText } from '@shokujii/base/utils/avatarText.js'
import {
  CHAT_ATTACHMENT_MAX_BYTE_SIZE,
  CHAT_ATTACHMENT_MAX_COUNT,
  CHAT_MESSAGE_BODY_MAX_LENGTH,
} from '@shokujii/common/schemas/ChatMessage.js'
import { isAllowedChatAttachmentMimeType } from '@shokujii/base/utils/storage.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { CHAT_SEND_MESSAGE_ERROR, useChatStore } from '@shokujii/base/stores/chat.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import type { ResolveChatRoomPathFn, ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import ChatLeftSidebarContent from './ChatLeftSidebarContent.vue'
import ChatLog from './ChatLog.vue'

const MEMBERSHIP_WAIT_TIMEOUT_MS = 10_000
const CHAT_ATTACHMENT_MAX_SIZE_LABEL = '10MB'

type SelectedImage = {
  id: string
  file: File
  previewUrl: string
}

const props = defineProps<{
  roomId?: string
  resolveProfilePath?: ResolveUserPathFn
  resolveChatRoomPath: ResolveChatRoomPathFn
}>()

const emit = defineEmits<{
  openEvent: [payload: { communityId: string; eventId: string }]
  'navigate-room': [payload: { path: RouteLocationRaw; replace?: boolean }]
}>()

const { t } = useI18n()
const notification = useNotification()
const vuetifyDisplays = useDisplay()
const { isLeftSidebarOpen } = useResponsiveLeftSidebar(vuetifyDisplays.smAndDown)
const store = useChatStore()
const currentUserStore = useCurrentUserStore()
const currentUserId = computed(() => currentUserStore.firebaseUser?.uid ?? '')

const hasSpecifiedRoom = computed(() => props.roomId != null && props.roomId !== '')

const isMobileWithoutRoom = computed(() => {
  return vuetifyDisplays.smAndDown.value && !hasSpecifiedRoom.value && store.activeRoom == null
})

const needsOpenRoom = (roomId: string): boolean => {
  return store.activeRoomId !== roomId || store.activeRoom == null
}

const openMobileChatList = (): void => {
  if (vuetifyDisplays.smAndDown.value) {
    isLeftSidebarOpen.value = true
  }
}

const SCROLL_NEAR_BOTTOM_THRESHOLD = 80

const msg = ref('')
const isSending = ref(false)
const isNearBottom = ref(true)
const chatLogPS = ref<InstanceType<typeof PerfectScrollbar> | null>(null)
const selectedImages = ref<SelectedImage[]>([])
const imageInputRef = ref<HTMLInputElement | null>(null)

const canSendMessage = computed(() => {
  return msg.value.trim() !== '' || selectedImages.value.length > 0
})

const canAddMoreImages = computed(() => {
  return selectedImages.value.length < CHAT_ATTACHMENT_MAX_COUNT
})

const revokeSelectedImagePreview = (image: SelectedImage): void => {
  URL.revokeObjectURL(image.previewUrl)
}

const clearSelectedImages = (): void => {
  for (const image of selectedImages.value) {
    revokeSelectedImagePreview(image)
  }
  selectedImages.value = []
  if (imageInputRef.value != null) {
    imageInputRef.value.value = ''
  }
}

const removeSelectedImage = (id: string): void => {
  const index = selectedImages.value.findIndex((image) => image.id === id)
  if (index === -1) {
    return
  }
  const [removed] = selectedImages.value.splice(index, 1)
  revokeSelectedImagePreview(removed)
  if (imageInputRef.value != null) {
    imageInputRef.value.value = ''
  }
}

const validateImageFile = (file: File): string | null => {
  if (!isAllowedChatAttachmentMimeType(file.type)) {
    return t('chat.error.attachment_type')
  }
  if (file.size > CHAT_ATTACHMENT_MAX_BYTE_SIZE) {
    return t('chat.error.attachment_too_large', { size: CHAT_ATTACHMENT_MAX_SIZE_LABEL })
  }
  return null
}

const onImageSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files == null || files.length === 0) {
    return
  }

  const remainingSlots = CHAT_ATTACHMENT_MAX_COUNT - selectedImages.value.length
  if (remainingSlots <= 0) {
    notification.show(t('chat.error.attachment_count_limit', { count: CHAT_ATTACHMENT_MAX_COUNT }), 'warning')
    input.value = ''
    return
  }

  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  if (files.length > remainingSlots) {
    notification.show(t('chat.error.attachment_count_limit', { count: CHAT_ATTACHMENT_MAX_COUNT }), 'warning')
  }

  for (const file of filesToAdd) {
    const validationError = validateImageFile(file)
    if (validationError != null) {
      notification.show(validationError, 'warning')
      continue
    }
    selectedImages.value.push({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  input.value = ''
}

const openImagePicker = (): void => {
  if (!canAddMoreImages.value) {
    notification.show(t('chat.error.attachment_count_limit', { count: CHAT_ATTACHMENT_MAX_COUNT }), 'warning')
    return
  }
  imageInputRef.value?.click()
}

const resolveSendMessageErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return t('chat.error.attachment_upload_failed')
  }
  switch (error.message) {
    case CHAT_SEND_MESSAGE_ERROR.attachment_count_limit:
      return t('chat.error.attachment_count_limit', { count: CHAT_ATTACHMENT_MAX_COUNT })
    case CHAT_SEND_MESSAGE_ERROR.attachment_type:
      return t('chat.error.attachment_type')
    case CHAT_SEND_MESSAGE_ERROR.attachment_too_large:
      return t('chat.error.attachment_too_large', { size: CHAT_ATTACHMENT_MAX_SIZE_LABEL })
    case CHAT_SEND_MESSAGE_ERROR.body_too_long:
      return t('chat.error.body_too_long', { count: CHAT_MESSAGE_BODY_MAX_LENGTH })
    default:
      return t('chat.error.attachment_upload_failed')
  }
}

const resolveSendMessageErrorVariant = (error: unknown): 'warning' | 'error' => {
  if (!(error instanceof Error)) {
    return 'error'
  }
  return error.message === CHAT_SEND_MESSAGE_ERROR.attachment_count_limit ||
    error.message === CHAT_SEND_MESSAGE_ERROR.attachment_type ||
    error.message === CHAT_SEND_MESSAGE_ERROR.attachment_too_large ||
    error.message === CHAT_SEND_MESSAGE_ERROR.body_too_long
    ? 'warning'
    : 'error'
}

const getChatLogScrollEl = (): HTMLElement | null => {
  const ps = chatLogPS.value as (InstanceType<typeof PerfectScrollbar> & { ps?: { element?: HTMLElement } }) | null
  const element = ps?.ps?.element
  return element instanceof HTMLElement ? element : null
}

const updateIsNearBottom = (el: HTMLElement): void => {
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_NEAR_BOTTOM_THRESHOLD
}

const scrollToBottomInChatLog = () => {
  isNearBottom.value = true
  nextTick(() => {
    const scrollEl = getChatLogScrollEl()
    if (scrollEl != null) {
      scrollEl.scrollTop = scrollEl.scrollHeight
    }
  })
}

const tryMarkActiveRoomAsRead = (): void => {
  const userId = currentUserId.value
  const roomId = store.activeRoomId
  if (userId === '' || roomId == null) {
    return
  }
  store.tryMarkLatestMessagesAsRead(roomId, userId)
}

const ensureRoomOpened = (roomId: string): void => {
  if (needsOpenRoom(roomId)) {
    store.openRoom(roomId)
    scrollToBottomInChatLog()
  }
}

const onChatLogScroll = (event: Event) => {
  const target = event.target as HTMLElement
  updateIsNearBottom(target)
  if (isNearBottom.value) {
    tryMarkActiveRoomAsRead()
  }
  if (target.scrollTop <= 48 && store.hasMoreMessages && !store.isLoadingOlderMessages) {
    void loadOlderMessages()
  }
}

const navigateToChatPath = (roomId?: string, replace = false): void => {
  const path = props.resolveChatRoomPath(roomId)
  emit('navigate-room', { path, replace })
}

let pendingRoomTimeoutId: ReturnType<typeof setTimeout> | null = null

const clearPendingRoomTimeout = (): void => {
  if (pendingRoomTimeoutId != null) {
    clearTimeout(pendingRoomTimeoutId)
    pendingRoomTimeoutId = null
  }
}

const openRoom = async (roomId: string) => {
  const userId = currentUserId.value
  if (userId === '') return

  if (props.roomId !== roomId) {
    navigateToChatPath(roomId)
  }
  store.openRoom(roomId)
  msg.value = ''
  if (vuetifyDisplays.smAndDown.value) {
    isLeftSidebarOpen.value = false
  }
  scrollToBottomInChatLog()
  tryMarkActiveRoomAsRead()
}

const sendMessage = async () => {
  if (isSending.value) return

  const userId = currentUserId.value
  const roomId = store.activeRoomId
  if (userId === '' || roomId == null) return
  if (store.activeRoom?.isReadonly === true) return
  if (!canSendMessage.value) return

  isSending.value = true
  try {
    await store.sendMessage(roomId, userId, {
      body: msg.value,
      imageFiles: selectedImages.value.map((image) => image.file),
    })
    msg.value = ''
    clearSelectedImages()
    scrollToBottomInChatLog()
  } catch (error) {
    notification.show(resolveSendMessageErrorMessage(error), resolveSendMessageErrorVariant(error))
  } finally {
    isSending.value = false
  }
}

const onComposeKeydown = (event: KeyboardEvent): void => {
  if (event.isComposing) {
    return
  }
  if (event.key !== 'Enter') {
    return
  }
  if (!(event.metaKey || event.ctrlKey)) {
    return
  }
  event.preventDefault()
  void sendMessage()
}

const loadOlderMessages = async () => {
  const roomId = store.activeRoomId
  if (roomId == null) return

  const scrollEl = getChatLogScrollEl()
  const prevScrollHeight = scrollEl?.scrollHeight ?? 0

  await store.loadOlderMessages(roomId)

  nextTick(() => {
    const el = getChatLogScrollEl()
    if (el != null && prevScrollHeight > 0) {
      el.scrollTop = el.scrollHeight - prevScrollHeight
      updateIsNearBottom(el)
    }
  })
}

const canOpenActiveEvent = computed(() => {
  const room = store.activeRoom
  return (
    room != null &&
    room.roomType === 'event' &&
    room.communityId != null &&
    room.eventId != null &&
    room.displayTitleReady
  )
})

const activeRoomAvatarLabel = computed(() => avatarText(store.activeRoom?.displayTitle ?? ''))

const onActiveRoomAvatarClick = () => {
  const room = store.activeRoom
  if (!canOpenActiveEvent.value || room?.communityId == null || room.eventId == null) {
    return
  }
  emit('openEvent', { communityId: room.communityId, eventId: room.eventId })
}

watch(
  () => [store.membershipsLoaded, store.rooms, props.roomId, currentUserId.value] as const,
  ([loaded, rooms, roomId, userId]) => {
    clearPendingRoomTimeout()

    if (userId === '') {
      store.unsubscribeActiveRoom()
      return
    }
    if (!loaded) return

    const hasRoomParam = roomId != null && roomId !== ''

    if (rooms.length === 0) {
      if (store.activeRoomId != null) {
        store.unsubscribeActiveRoom()
      }
      if (hasRoomParam) {
        notification.show(t('chat.error.room_not_found'), 'warning')
        navigateToChatPath(undefined, true)
      }
      return
    }

    if (!hasRoomParam) {
      if (vuetifyDisplays.smAndDown.value) {
        openMobileChatList()
        const lastRoomId = store.activeRoomId
        if (lastRoomId != null && rooms.some((room) => room.roomId === lastRoomId)) {
          ensureRoomOpened(lastRoomId)
        }
        return
      }

      const targetRoomId = rooms[0].roomId
      if (props.roomId !== targetRoomId) {
        navigateToChatPath(targetRoomId, true)
      }
      ensureRoomOpened(targetRoomId)
      return
    }

    const roomInList = rooms.some((room) => room.roomId === roomId)
    if (roomInList) {
      ensureRoomOpened(roomId)
      return
    }

    store.unsubscribeActiveRoom()
    pendingRoomTimeoutId = setTimeout(() => {
      pendingRoomTimeoutId = null
      if (!store.rooms.some((room) => room.roomId === roomId)) {
        notification.show(t('chat.error.room_not_found'), 'warning')
        navigateToChatPath(undefined, true)
      }
    }, MEMBERSHIP_WAIT_TIMEOUT_MS)
  },
  { immediate: true },
)

watch(
  () => store.rooms,
  (rooms) => {
    const roomId = props.roomId
    const userId = currentUserId.value
    if (!store.membershipsLoaded || userId === '' || roomId == null || roomId === '') {
      return
    }
    if (!rooms.some((room) => room.roomId === roomId)) {
      return
    }

    clearPendingRoomTimeout()
    ensureRoomOpened(roomId)
  },
)

watch(
  () => store.openChatListRequestId,
  () => {
    openMobileChatList()
  },
)

watch(
  () => history.state?.openChatList as boolean | undefined,
  (openChatList) => {
    if (openChatList === true) {
      openMobileChatList()
    }
  },
  { immediate: true },
)

watch(
  () => store.messages.length,
  () => {
    if (isNearBottom.value) {
      scrollToBottomInChatLog()
      tryMarkActiveRoomAsRead()
    }
  },
)

onBeforeUnmount(() => {
  clearPendingRoomTimeout()
  clearSelectedImages()
})
</script>

<template>
  <VLayout class="chat-app-layout bg-surface h-100">
    <VNavigationDrawer
      v-model="isLeftSidebarOpen"
      absolute
      touchless
      location="start"
      width="370"
      :temporary="$vuetify.display.smAndDown"
      class="chat-list-sidebar"
      :permanent="$vuetify.display.mdAndUp"
    >
      <ChatLeftSidebarContent
        :is-drawer-open="isLeftSidebarOpen"
        @open-room="openRoom"
        @open-event="emit('openEvent', $event)"
        @close="isLeftSidebarOpen = false"
      />
    </VNavigationDrawer>

    <VMain class="chat-content-container h-100">
      <div v-if="store.activeRoom != null" class="active-chat-panel d-flex flex-column h-100 w-100">
        <div class="active-chat-header d-flex align-center text-medium-emphasis px-4">
          <VBtn
            variant="text"
            color="default"
            icon
            size="small"
            class="d-md-none me-3"
            @click="isLeftSidebarOpen = true"
          >
            <VIcon size="24" :icon="mdiMenu" />
          </VBtn>

          <VAvatar
            size="40"
            :variant="store.activeRoom.coverImageUrl != null ? 'flat' : 'tonal'"
            :color="store.activeRoom.coverImageUrl != null ? undefined : 'primary'"
            class="me-3"
            :class="{ 'cursor-pointer': canOpenActiveEvent }"
            @click.stop="onActiveRoomAvatarClick"
          >
            <VImg
              v-if="store.activeRoom.coverImageUrl != null"
              :src="store.activeRoom.coverImageUrl"
              :alt="store.activeRoom.displayTitle"
              cover
            />
            <span v-else>{{ activeRoomAvatarLabel }}</span>
          </VAvatar>

          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex align-center gap-2">
              <h6
                class="text-base font-weight-regular text-truncate mb-0"
                :class="{ 'cursor-pointer': canOpenActiveEvent }"
                :role="canOpenActiveEvent ? 'link' : undefined"
                :tabindex="canOpenActiveEvent ? 0 : undefined"
                :aria-label="
                  canOpenActiveEvent ? t('chat.open_event_page', { name: store.activeRoom.displayTitle }) : undefined
                "
                @click="onActiveRoomAvatarClick"
                @keydown.enter.prevent="onActiveRoomAvatarClick"
                @keydown.space.prevent="onActiveRoomAvatarClick"
              >
                {{ store.activeRoom.displayTitle }}
              </h6>
              <VChip v-if="!store.activeRoom.isActive" size="x-small" color="secondary" variant="tonal">
                {{ t('chat.ended_label') }}
              </VChip>
            </div>
          </div>
        </div>

        <VDivider />

        <PerfectScrollbar
          ref="chatLogPS"
          tag="div"
          :options="{ wheelPropagation: false }"
          class="flex-grow-1 chat-log-scroll"
          @scroll="onChatLogScroll"
        >
          <ChatLog :current-user-id="currentUserId" :resolve-profile-path="resolveProfilePath" />
        </PerfectScrollbar>

        <VForm class="chat-log-message-form" @submit.prevent="sendMessage">
          <input
            ref="imageInputRef"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp"
            class="d-none"
            :aria-label="t('chat.attach_image')"
            @change="onImageSelected"
          />

          <div class="d-flex align-end gap-1">
            <VBtn
              v-if="!store.activeRoom.isReadonly"
              icon
              variant="text"
              color="default"
              size="small"
              class="chat-compose-attach-btn flex-shrink-0"
              :aria-label="t('chat.attach_image')"
              @click="openImagePicker"
            >
              <VIcon :icon="mdiImageOutline" />
            </VBtn>
            <div
              class="chat-compose-box flex-grow-1"
              :class="{ 'chat-compose-box--readonly': store.activeRoom.isReadonly }"
            >
              <div
                v-if="selectedImages.length > 0"
                role="group"
                :aria-label="t('chat.attachment_preview_group')"
                class="chat-compose-attachments px-3 pt-3 pb-1"
              >
                <div class="chat-compose-attachments-row">
                  <div v-for="image in selectedImages" :key="image.id" class="chat-compose-thumb">
                    <VImg
                      :src="image.previewUrl"
                      :alt="t('chat.image_preview_alt')"
                      class="chat-compose-thumb-img rounded"
                    />
                    <div v-if="isSending" class="chat-compose-thumb-overlay rounded d-flex align-center justify-center">
                      <VProgressCircular indeterminate size="24" width="2" color="surface" />
                    </div>
                    <button
                      type="button"
                      class="chat-compose-remove"
                      :aria-label="t('chat.remove_attachment')"
                      :disabled="isSending"
                      @click="removeSelectedImage(image.id)"
                    >
                      <VIcon :icon="mdiClose" size="14" />
                    </button>
                  </div>
                  <button
                    v-if="canAddMoreImages"
                    type="button"
                    class="chat-compose-add-btn rounded d-flex align-center justify-center"
                    :aria-label="t('chat.attach_image')"
                    :disabled="isSending"
                    @click="openImagePicker"
                  >
                    <VIcon :icon="mdiPlus" size="24" />
                  </button>
                </div>
              </div>
              <VTextarea
                v-model="msg"
                variant="plain"
                class="chat-compose-input"
                :placeholder="t('chat.message_placeholder')"
                :disabled="store.activeRoom.isReadonly"
                :maxlength="CHAT_MESSAGE_BODY_MAX_LENGTH"
                :aria-label="t('chat.message_input_label')"
                auto-grow
                rows="1"
                max-rows="10"
                hide-details
                @keydown="onComposeKeydown"
              />
            </div>
            <VBtn
              type="submit"
              icon
              variant="text"
              color="primary"
              class="chat-compose-send-btn flex-shrink-0"
              :aria-label="t('chat.send')"
              :disabled="store.activeRoom.isReadonly || isSending || !canSendMessage"
              :loading="isSending"
            >
              <VIcon :icon="mdiSend" />
            </VBtn>
          </div>
          <div v-if="store.activeRoom.isReadonly" class="text-caption text-disabled mt-2">
            {{ t('chat.readonly_hint') }}
          </div>
        </VForm>
      </div>

      <div
        v-else-if="!store.membershipsLoaded"
        class="active-chat-panel d-flex h-100 w-100 align-center justify-center"
      >
        <VProgressCircular indeterminate color="primary" />
      </div>

      <div v-else-if="store.rooms.length === 0" class="active-chat-panel d-flex flex-column h-100 w-100">
        <div class="chat-empty-state d-flex flex-grow-1 align-center justify-center flex-column text-center px-6">
          <VAvatar size="109" class="elevation-3 mb-6 bg-surface">
            <VIcon size="50" class="rounded-0 text-high-emphasis" :icon="mdiMessageOutline" />
          </VAvatar>
          <p class="mb-2 font-weight-medium text-lg text-high-emphasis">
            {{ t('chat.empty.no_rooms') }}
          </p>
          <p class="mb-0 text-medium-emphasis">
            {{ t('chat.empty.no_rooms_hint') }}
          </p>
        </div>
      </div>

      <div v-else-if="isMobileWithoutRoom" class="active-chat-panel d-flex flex-column h-100 w-100">
        <div class="chat-empty-state d-flex flex-grow-1 align-center justify-center flex-column text-center px-6">
          <VAvatar size="109" class="elevation-3 mb-6 bg-surface">
            <VIcon size="50" class="rounded-0 text-high-emphasis" :icon="mdiMessageOutline" />
          </VAvatar>
          <p class="mb-2 font-weight-medium text-lg text-high-emphasis">
            {{ t('chat.empty.select_room') }}
          </p>
          <p class="mb-0 text-medium-emphasis">
            {{ t('chat.empty.select_room_hint') }}
          </p>
        </div>
      </div>

      <div v-else class="active-chat-panel d-flex h-100 w-100 align-center justify-center">
        <VProgressCircular indeterminate color="primary" />
      </div>
    </VMain>
  </VLayout>
</template>

<style scoped lang="scss">
.chat-app-layout {
  flex: 1 1 auto;
  block-size: 100%;
  inline-size: 100%;
  min-inline-size: 0;
  overflow: hidden;
}

.active-chat-panel {
  flex: 1 1 auto;
  inline-size: 100%;
  min-block-size: 0;
  overflow: hidden;
}

.chat-empty-state {
  inline-size: 100%;
}

.active-chat-header {
  flex-shrink: 0;
  min-block-size: 68px;
}

.chat-log-scroll {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: hidden;
}

.chat-log-message-form {
  flex-shrink: 0;
  margin-block-start: 12px;
  margin-block-end: 8px;
  padding-inline: 12px;

  @media (min-width: 600px) {
    margin-block-start: 12px;
    margin-block-end: 12px;
    padding-inline: 20px;
  }
}

.chat-compose-attach-btn,
.chat-compose-send-btn {
  min-inline-size: 44px;
  min-block-size: 44px;
}

.chat-compose-box {
  min-inline-size: 0;
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  box-shadow:
    0 2px 6px rgba(var(--v-shadow-key-umbra-color), 0.14),
    0 0 transparent,
    0 0 transparent;

  &--readonly {
    opacity: var(--v-disabled-opacity);
  }
}

.chat-compose-attachments-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-block-end: 2px;
}

.chat-compose-add-btn {
  flex-shrink: 0;
  inline-size: 64px;
  block-size: 64px;
  padding: 0;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.24);
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.6);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

@media (min-width: 600px) {
  .chat-compose-add-btn {
    inline-size: 72px;
    block-size: 72px;
  }
}

.chat-compose-thumb {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
}

.chat-compose-thumb-img {
  display: block;
  inline-size: 64px;
  block-size: 64px;
  background: rgba(var(--v-theme-on-surface), 0.04);

  :deep(.v-img__img) {
    object-fit: contain;
  }
}

@media (min-width: 600px) {
  .chat-compose-thumb-img {
    inline-size: 72px;
    block-size: 72px;
  }
}

.chat-compose-thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.chat-compose-remove {
  position: absolute;
  inset-block-start: -4px;
  inset-inline-end: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 22px;
  block-size: 22px;
  padding: 0;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 50%;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  cursor: pointer;

  &::before {
    position: absolute;
    inset: -11px;
    content: '';
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.chat-compose-input {
  :deep(.v-field) {
    background: transparent;
    box-shadow: none;
    border-radius: 0;
  }

  :deep(.v-field__field) {
    align-items: center;
    min-block-size: 48px;
  }

  :deep(.v-field__input) {
    mask-image: none;
    padding-inline: 16px;
    padding-block: 12px;
  }

  :deep(textarea) {
    margin-block: 0;
    padding-block: 0;
    line-height: 1.5;
    // iOS WebKit: 16px 未満の input/textarea フォーカス時にページ全体がオートズームする
    font-size: 1rem;
  }
}

.chat-content-container {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: hidden;
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));

  :deep(.v-main__wrap) {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    block-size: 100%;
  }
}

.chat-list-sidebar {
  :deep(.v-navigation-drawer__content) {
    display: flex;
    flex-direction: column;
  }
}
</style>
