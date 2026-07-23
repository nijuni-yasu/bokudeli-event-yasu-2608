<script setup lang="ts">
import { ref, watch } from 'vue'
import { TAG_GENRES } from '@shokujii/common/constants/tags.js'
import { normalizeTag } from '@shokujii/common/utils/normalizeTag.js'
import TagBadge from '@shokujii/base/components/TagBadge.vue'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const freeInput = ref('')
const snackbar = ref(false)
const snackbarMessage = ref('')

const showError = (msg: string) => {
  snackbarMessage.value = msg
  snackbar.value = true
}

watch(freeInput, (v) => {
  const n = normalizeTag(v)
  if (n !== v) {
    freeInput.value = n
  }
})

const remove = (t: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((x) => x !== t),
  )
}

const addTag = (raw: string) => {
  const t = normalizeTag(raw)
  if (t.length === 0) return
  if (t.length > 20) {
    showError('タグは最大20文字までです')
    return
  }
  if (props.modelValue.includes(t)) {
    return
  }
  if (props.modelValue.length >= 10) {
    showError('タグは最大10個までです')
    return
  }
  emit('update:modelValue', [...props.modelValue, t])
  freeInput.value = ''
}

const addMaster = (t: string) => {
  addTag(t)
}
</script>

<template>
  <div>
    <div class="text-subtitle-2 mb-2">設定中のタグ（最大10個）</div>
    <div class="d-flex flex-wrap mb-4">
      <TagBadge v-for="t in modelValue" :key="t" :tag="t" :clickable="true" @click="remove(t)" />
      <span v-if="modelValue.length === 0" class="text-medium-emphasis text-body-2">未設定</span>
    </div>

    <v-text-field
      v-model="freeInput"
      label="フリー入力で追加"
      density="comfortable"
      variant="outlined"
      hide-details="auto"
      class="mb-4"
      @keyup.enter="addTag(freeInput)"
    />
    <v-btn
      color="primary"
      variant="tonal"
      class="mb-6"
      :disabled="normalizeTag(freeInput).length === 0"
      @click="addTag(freeInput)"
    >
      フリータグを追加
    </v-btn>

    <div class="text-subtitle-2 mb-2">マスタタグ（ジャンル別）</div>
    <v-expansion-panels variant="accordion" multiple>
      <v-expansion-panel v-for="g in TAG_GENRES" :key="g.genre" :title="g.genre">
        <v-expansion-panel-text>
          <div class="d-flex flex-wrap">
            <v-btn
              v-for="tag in g.tags"
              :key="tag"
              size="small"
              variant="text"
              class="ma-1"
              :disabled="modelValue.includes(tag) || modelValue.length >= 10"
              @click="addMaster(tag)"
            >
              {{ tag }}
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-snackbar v-model="snackbar" color="error" location="top" timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>
