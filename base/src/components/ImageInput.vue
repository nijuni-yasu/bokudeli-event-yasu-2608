<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VInput } from 'vuetify/components'

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

const imageFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const currentUrlIndex = ref(0)

watch(
  () => props.urls,
  () => {
    currentUrlIndex.value = 0
  },
)

const onImageError = () => {
  const candidates = props.urls?.filter((u) => u != null && u !== '') ?? []
  // すべて失敗した場合は currntUrlIndex === candidates.length になるので、
  // iconImageUrl が null になることを保証する。
  if (currentUrlIndex.value < candidates.length) {
    currentUrlIndex.value++
  }
}

const iconImageUrl = computed(() => {
  const ii = imageFile.value
  if (ii != null) {
    if (ii.type.startsWith('image/')) {
      emits('fileSelected', ii)
      return URL.createObjectURL(ii)
    } else {
      emits('fileSelected', null)
      return null
    }
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
      <v-file-input ref="fileInputRef" v-model="imageFile" class="file-input" accept="image/*" />
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
