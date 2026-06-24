<script setup lang="ts">
import { mdiImageBrokenVariant } from '@mdi/js'
import type { ChatAttachment } from '@shokujii/common/schemas/ChatMessage.js'
import { getChatAttachmentBlob } from '@shokujii/base/utils/storage.js'

const props = defineProps<{
  attachment: ChatAttachment
}>()

const emit = defineEmits<{
  expand: [payload: { url: string; alt: string }]
}>()

const { t } = useI18n()

const objectUrl = ref<string | null>(null)
const isLoading = ref(true)
const hasError = ref(false)

const isUnmounted = ref(false)

const revokeObjectUrl = (): void => {
  if (objectUrl.value != null) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
}

const loadAttachment = async (): Promise<void> => {
  isLoading.value = true
  hasError.value = false
  revokeObjectUrl()

  try {
    const blob = await getChatAttachmentBlob(props.attachment.storage_path)
    if (isUnmounted.value) {
      return
    }
    objectUrl.value = URL.createObjectURL(blob)
  } catch {
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

const onExpandClick = (): void => {
  if (objectUrl.value == null) {
    return
  }
  emit('expand', { url: objectUrl.value, alt: props.attachment.file_name })
}

onMounted(() => {
  void loadAttachment()
})

onBeforeUnmount(() => {
  isUnmounted.value = true
  revokeObjectUrl()
})
</script>

<template>
  <div class="chat-attachment-image mb-1">
    <VProgressCircular v-if="isLoading" indeterminate size="24" width="2" color="primary" />
    <button v-else-if="objectUrl != null" type="button" class="chat-attachment-button" @click="onExpandClick">
      <VImg
        :src="objectUrl"
        :alt="attachment.file_name"
        loading="lazy"
        max-width="240"
        max-height="240"
        cover
        class="rounded"
      />
    </button>
    <div v-else-if="hasError" class="chat-attachment-error text-disabled text-sm">
      <VIcon :icon="mdiImageBrokenVariant" size="20" class="me-1" />
      {{ t('chat.error.attachment_load_failed') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-attachment-button {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.chat-attachment-error {
  display: flex;
  align-items: center;
}
</style>
