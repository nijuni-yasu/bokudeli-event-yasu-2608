<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VInput } from 'vuetify/components'
import { ALLOWED_IMAGE_ACCEPT_ATTR } from '@shokujii/common/constants/imageMimeTypes.js'
import { validateImageFile } from '@shokujii/base/utils/image'

// https://stackoverflow.com/a/77201828
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : A
type ValidationRule = UnwrapReadonlyArray<VInput['rules']>

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  urls: (string | undefined)[]
  rules?: ValidationRule[]
  readonly?: boolean | null
}>()

const emits = defineEmits<{
  fileSelected: [value: File | null]
}>()

const { t: $t } = useI18n()

const imageFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const currentUrlIndex = ref(0)
const formatErrorMessage = ref<string | null>(null)
const objectUrl = ref<string | null>(null)

const releaseObjectUrl = () => {
  if (objectUrl.value != null) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
}

watch(
  () => props.urls,
  () => {
    currentUrlIndex.value = 0
  },
)

watch(imageFile, (newFile) => {
  releaseObjectUrl()
  if (newFile == null) {
    // invalid 経由で imageFile が null になった場合、formatErrorMessage は残してエラー表示を維持する
    emits('fileSelected', null)
    return
  }
  const result = validateImageFile(newFile)
  if (!result.ok) {
    formatErrorMessage.value = $t(result.messageKey)
    // imageFile を null にすると watch が再発火して null 分岐で emits される。
    // ここでは emit せず、null 分岐側に集約することで親への通知が 1 回になる。
    imageFile.value = null
    return
  }
  formatErrorMessage.value = null
  objectUrl.value = URL.createObjectURL(newFile)
  emits('fileSelected', newFile)
})

onBeforeUnmount(releaseObjectUrl)

const onImageError = () => {
  const candidates = props.urls?.filter((u) => u != null && u !== '') ?? []
  // すべて失敗した場合は currntUrlIndex === candidates.length になるので、
  // iconImageUrl が null になることを保証する。
  if (currentUrlIndex.value < candidates.length) {
    currentUrlIndex.value++
  }
}

const iconImageUrl = computed(() => {
  if (objectUrl.value != null) {
    return objectUrl.value
  }
  const candidates = props.urls?.filter((u) => u != null && u !== '') ?? []
  return candidates[currentUrlIndex.value] ?? null
})

const onIconTriggerUpload = () => {
  if (props.readonly === true) {
    return
  }
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="v-input--error">
    <div
      class="image-upload-container"
      :style="{ cursor: readonly === true ? 'auto' : 'pointer' }"
      @click="onIconTriggerUpload"
      v-bind="$attrs"
    >
      <v-file-input ref="fileInputRef" v-model="imageFile" class="file-input" :accept="ALLOWED_IMAGE_ACCEPT_ATTR" />
      <v-img
        v-if="iconImageUrl != null"
        :src="iconImageUrl"
        @error="onImageError"
        v-bind="$attrs"
        class="image-style"
      />
      <slot v-else name="placeholder"></slot>
    </div>
    <v-validation :rules="rules" :validation-value="iconImageUrl ?? false">
      <template #default="{ errorMessages }">
        <div v-if="errorMessages.value.length !== 0" class="v-input__details">
          <div class="v-messages" role="alert" aria-live="polite">
            <div
              class="v-messages__message"
              v-for="(errorMessage, i) in errorMessages.value"
              :key="`error_message_${i}`"
            >
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </template>
    </v-validation>
    <div v-if="formatErrorMessage != null" class="v-input__details">
      <div class="v-messages" role="alert" aria-live="polite">
        <div class="v-messages__message">{{ formatErrorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.image-upload-container {
  .file-input {
    display: none;
  }

  width: fit-content;
  max-width: 100%;
  min-width: 100px;
  min-height: 100px;
  position: relative;
  border: 1px solid rgba(182, 182, 182, 0.2);
  border-radius: 8px;
  display: block;
  cursor: pointer;
}
.image-style {
  border-radius: 8px;
}
</style>
