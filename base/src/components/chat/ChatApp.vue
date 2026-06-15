<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { mdiClose, mdiImageOutline, mdiMenu, mdiMessageOutline, mdiSend } from '@mdi/js'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useDisplay } from 'vuetify'
import { useResponsiveLeftSidebar } from '@shokujii/base/composable/useResponsiveSidebar.js'
import { avatarText } from '@shokujii/base/utils/avatarText.js'
import { CHAT_ATTACHMENT_MAX_BYTE_SIZE, CHAT_MESSAGE_BODY_MAX_LENGTH } from '@shokujii/common/schemas/ChatMessage.js'
import { isAllowedChatAttachmentMimeType } from '@shokujii/base/utils/storage.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import type { ResolveChatRoomPathFn, ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import ChatLeftSidebarContent from './ChatLeftSidebarContent.vue'
import ChatLog from './ChatLog.vue'

const MEMBERSHIP_WAIT_TIMEOUT_MS = 10_000
const CHAT_ATTACHMENT_MAX_SIZE_LABEL = '10MB'

const props = defineProps<{
  roomId?: string
  resolveProfilePath?: ResolveUserPathFn
  resolveChatRoomPath?: ResolveChatRoomPathFn
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

const SCROLL_NEAR_BOTTOM_THRESHOLD = 80

const msg = ref('')
const isSending = ref(false)
const isNearBottom = ref(true)
const chatLogPS = ref<InstanceType<typeof PerfectScrollbar> | null>(null)
const selectedImageFile = ref<File | null>(null)
const selectedImagePreviewUrl = ref<string | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)

const canSendMessage = computed(() => {
  return msg.value.trim() !== '' || selectedImageFile.value != null
})

const clearSelectedImage = (): void => {
  if (selectedImagePreviewUrl.value != null) {
    URL.revokeObjectURL(selectedImagePreviewUrl.value)
  }
  selectedImageFile.value = null
  selectedImagePreviewUrl.value = null
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
  const file = input.files?.[0]
  if (file == null) {
    return
  }

  const validationError = validateImageFile(file)
  if (validationError != null) {
    notification.show(validationError, 'warning')
    input.value = ''
    return
  }

  clearSelectedImage()
  selectedImageFile.value = file
  selectedImagePreviewUrl.value = URL.createObjectURL(file)
}

const openImagePicker = (): void => {
  imageInputRef.value?.click()
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

const onChatLogScroll = (event: Event) => {
  const target = event.target as HTMLElement
  updateIsNearBottom(target)
  if (target.scrollTop <= 48 && store.hasMoreMessages && !store.isLoadingOlderMessages) {
    void loadOlderMessages()
  }
}

const navigateToChatPath = (roomId?: string, replace = false): void => {
  const path = props.resolveChatRoomPath?.(roomId) ?? {
    path: roomId != null && roomId !== '' ? `/chat/${roomId}` : '/chat',
  }
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
  store.openRoom(roomId, userId)
  msg.value = ''
  if (vuetifyDisplays.smAndDown.value) {
    isLeftSidebarOpen.value = false
  }
  scrollToBottomInChatLog()
}

const sendMessage = async () => {
  const userId = currentUserId.value
  const roomId = store.activeRoomId
  if (userId === '' || roomId == null) return
  if (store.activeRoom?.isReadonly === true) return
  if (!canSendMessage.value) return

  isSending.value = true
  try {
    await store.sendMessage(roomId, userId, {
      body: msg.value,
      imageFile: selectedImageFile.value ?? undefined,
    })
    msg.value = ''
    clearSelectedImage()
    scrollToBottomInChatLog()
  } catch {
    notification.show(t('chat.error.attachment_upload_failed'), 'error')
  } finally {
    isSending.value = false
  }
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

    const hasSpecifiedRoom = roomId != null && roomId !== ''

    if (rooms.length === 0) {
      if (store.activeRoomId != null) {
        store.unsubscribeActiveRoom()
      }
      if (hasSpecifiedRoom) {
        notification.show(t('chat.error.room_not_found'), 'warning')
        navigateToChatPath(undefined, true)
      }
      return
    }

    if (!hasSpecifiedRoom) {
      const targetRoomId = rooms[0].roomId
      if (props.roomId !== targetRoomId) {
        navigateToChatPath(targetRoomId, true)
      }
      if (store.activeRoomId !== targetRoomId) {
        store.openRoom(targetRoomId, userId)
        scrollToBottomInChatLog()
      }
      return
    }

    const roomInList = rooms.some((room) => room.roomId === roomId)
    if (roomInList) {
      if (store.activeRoomId !== roomId) {
        store.openRoom(roomId, userId)
        scrollToBottomInChatLog()
      }
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
    if (store.activeRoomId !== roomId) {
      store.openRoom(roomId, userId)
      scrollToBottomInChatLog()
    }
  },
)

watch(
  () => store.messages.length,
  () => {
    if (isNearBottom.value) {
      scrollToBottomInChatLog()
    }
  },
)

onBeforeUnmount(() => {
  clearPendingRoomTimeout()
  clearSelectedImage()
  store.unsubscribeActiveRoom()
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
              <h6 class="text-base font-weight-regular text-truncate">
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

        <VForm class="chat-log-message-form mb-3 mx-5" @submit.prevent="sendMessage">
          <input
            ref="imageInputRef"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            class="d-none"
            :aria-label="t('chat.attach_image')"
            @change="onImageSelected"
          />

          <div v-if="selectedImagePreviewUrl != null" class="chat-attachment-preview mb-3">
            <VImg
              :src="selectedImagePreviewUrl"
              :alt="t('chat.image_preview_alt')"
              max-height="120"
              max-width="160"
              cover
              class="rounded"
            />
            <VBtn
              icon
              variant="text"
              size="x-small"
              color="default"
              class="chat-attachment-preview-remove"
              :aria-label="t('chat.remove_attachment')"
              @click="clearSelectedImage"
            >
              <VIcon :icon="mdiClose" size="18" />
            </VBtn>
          </div>

          <div class="d-flex align-end gap-3">
            <VBtn
              v-if="!store.activeRoom.isReadonly"
              icon
              variant="text"
              color="default"
              :aria-label="t('chat.attach_image')"
              @click="openImagePicker"
            >
              <VIcon :icon="mdiImageOutline" />
            </VBtn>
            <VTextarea
              v-model="msg"
              variant="solo"
              class="chat-message-input flex-grow-1"
              :placeholder="t('chat.message_placeholder')"
              :disabled="store.activeRoom.isReadonly"
              :maxlength="CHAT_MESSAGE_BODY_MAX_LENGTH"
              :aria-label="t('chat.message_input_label')"
              auto-grow
              rows="1"
              max-rows="10"
              hide-details
            />
            <VBtn
              type="submit"
              color="primary"
              :prepend-icon="mdiSend"
              :disabled="store.activeRoom.isReadonly || isSending || !canSendMessage"
              :loading="isSending"
            >
              {{ t('chat.send') }}
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
  inline-size: 100%;
  min-block-size: 0;
}

.chat-empty-state {
  inline-size: 100%;
}

.active-chat-header {
  flex-shrink: 0;
  min-block-size: 68px;
}

.chat-log-scroll {
  min-block-size: 0;
}

.chat-log-message-form {
  flex-shrink: 0;
}

.chat-attachment-preview {
  position: relative;
  display: inline-block;
}

.chat-attachment-preview-remove {
  position: absolute;
  inset-block-start: 4px;
  inset-inline-end: 4px;
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.chat-content-container {
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.chat-list-sidebar {
  :deep(.v-navigation-drawer__content) {
    display: flex;
    flex-direction: column;
  }
}
</style>
