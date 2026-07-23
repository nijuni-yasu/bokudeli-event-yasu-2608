<script setup lang="ts">
import { mdiDownload, mdiImageBrokenVariant } from '@mdi/js'
import type { ChatAttachment } from '@shokujii/common/schemas/ChatMessage.js'
import { getChatAttachmentBlob } from '@shokujii/base/utils/storage.js'
import { computeChatAttachmentDisplaySize } from '@shokujii/base/utils/chatAttachmentDisplaySize.js'
import { downloadBlob } from '@shokujii/base/utils/downloadBlob.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { injectionKeyChatAttachmentLightboxPin } from './symbols.js'

const props = withDefaults(
  defineProps<{
    attachment: ChatAttachment
    layout?: 'fluid' | 'tile'
  }>(),
  {
    layout: 'fluid',
  },
)

const isTileLayout = computed(() => props.layout === 'tile')

const emit = defineEmits<{
  expand: [payload: { url: string; alt: string }]
  loaded: [payload: { storagePath: string; url: string }]
  unloaded: [payload: { storagePath: string }]
}>()

const lightboxPinActive = inject(injectionKeyChatAttachmentLightboxPin, ref(false))

const { t } = useI18n()
const notification = useNotification()

const objectUrl = ref<string | null>(null)
const attachmentBlob = ref<Blob | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const isDownloading = ref(false)

let loadGeneration = 0

const displaySize = computed(() => computeChatAttachmentDisplaySize(props.attachment.width, props.attachment.height))

const displaySizeStyle = computed(() => ({
  width: `${displaySize.value.width}px`,
  height: `${displaySize.value.height}px`,
}))

const revokeObjectUrl = (): void => {
  if (objectUrl.value != null) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
  attachmentBlob.value = null
}

const loadAttachment = async (): Promise<void> => {
  const generation = ++loadGeneration
  isLoading.value = true
  hasError.value = false
  if (objectUrl.value != null) {
    emit('unloaded', { storagePath: props.attachment.storage_path })
    revokeObjectUrl()
  }

  try {
    const blob = await getChatAttachmentBlob(props.attachment.storage_path)
    if (generation !== loadGeneration) {
      return
    }
    attachmentBlob.value = blob
    objectUrl.value = URL.createObjectURL(blob)
    emit('loaded', { storagePath: props.attachment.storage_path, url: objectUrl.value })
  } catch {
    if (generation !== loadGeneration) {
      return
    }
    hasError.value = true
  } finally {
    if (generation === loadGeneration) {
      isLoading.value = false
    }
  }
}

const onExpandClick = (): void => {
  if (objectUrl.value == null) {
    return
  }
  emit('expand', { url: objectUrl.value, alt: props.attachment.file_name })
}

const onDownloadClick = async (): Promise<void> => {
  const blob = attachmentBlob.value
  if (blob == null || isDownloading.value) {
    return
  }
  isDownloading.value = true
  try {
    const result = await downloadBlob(blob, props.attachment.file_name)
    if (result === 'shared') {
      notification.show(t('chat.download_ios_hint'), 'info')
    }
  } catch {
    notification.show(t('chat.download_failed'), 'error')
  } finally {
    isDownloading.value = false
  }
}

onMounted(() => {
  void loadAttachment()
})

watch(
  () => props.attachment.storage_path,
  () => {
    void loadAttachment()
  },
)

onBeforeUnmount(() => {
  loadGeneration++
  if (lightboxPinActive.value) {
    return
  }
  if (objectUrl.value != null) {
    emit('unloaded', { storagePath: props.attachment.storage_path })
  }
  revokeObjectUrl()
})
</script>

<template>
  <div
    class="chat-attachment-image"
    :class="{ 'chat-attachment-image--tile': isTileLayout }"
    :style="isTileLayout ? undefined : displaySizeStyle"
  >
    <div v-if="isLoading" class="chat-attachment-placeholder d-flex align-center justify-center">
      <VProgressCircular indeterminate size="24" width="2" color="primary" />
    </div>
    <div
      v-else-if="objectUrl != null"
      class="chat-attachment-loaded"
      :class="{ 'chat-attachment-loaded--tile': isTileLayout }"
      :style="isTileLayout ? undefined : displaySizeStyle"
    >
      <VBtn
        icon
        variant="flat"
        size="x-small"
        color="surface"
        class="chat-attachment-download-btn"
        :loading="isDownloading"
        :aria-label="t('chat.download_attachment')"
        @click.stop="onDownloadClick"
      >
        <VIcon :icon="mdiDownload" size="18" />
      </VBtn>
      <button
        type="button"
        class="chat-attachment-button"
        :style="isTileLayout ? undefined : displaySizeStyle"
        @click="onExpandClick"
      >
        <VImg
          :src="objectUrl"
          :alt="attachment.file_name"
          :width="isTileLayout ? undefined : displaySize.width"
          :height="isTileLayout ? undefined : displaySize.height"
          :cover="isTileLayout"
          class="rounded chat-attachment-img"
          :class="{ 'chat-attachment-img--tile': isTileLayout }"
        />
      </button>
    </div>
    <div v-else-if="hasError" class="chat-attachment-error text-disabled text-sm">
      <VIcon :icon="mdiImageBrokenVariant" size="20" class="me-1" />
      {{ t('chat.error.attachment_load_failed') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-attachment-image--tile {
  inline-size: 100%;
  aspect-ratio: 1;
  margin-block-end: 0;
  min-inline-size: 0;
}

.chat-attachment-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
}

.chat-attachment-loaded {
  position: relative;
}

.chat-attachment-loaded--tile {
  inline-size: 100%;
  block-size: 100%;
}

.chat-attachment-download-btn {
  position: absolute;
  inset-block-start: 4px;
  inset-inline-end: 4px;
  z-index: 1;
  opacity: 0.92;
}

.chat-attachment-button {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.chat-attachment-image--tile .chat-attachment-button {
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.chat-attachment-img:not(.chat-attachment-img--tile) :deep(.v-img__img) {
  object-fit: contain;
}

.chat-attachment-img--tile {
  inline-size: 100%;
  block-size: 100%;
}

.chat-attachment-error {
  display: flex;
  align-items: center;
}
</style>
