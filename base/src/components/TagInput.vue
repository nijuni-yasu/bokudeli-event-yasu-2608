<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiPencilOutline, mdiTagOutline } from '@mdi/js'
import { TAG_GENRES } from '@shokujii/common/constants/tags.js'
import { normalizeTag, tagCodePointLength } from '@shokujii/common/utils/normalizeTag.js'
import TagBadge from '@shokujii/base/components/TagBadge.vue'

const props = withDefaults(
  defineProps<{
    tags: string[]
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  add: [tag: string]
  remove: [tag: string]
}>()

const { t: $t } = useI18n()

const freeInput = ref('')
const snackbar = ref(false)
const snackbarMessage = ref('')

const isAtLimit = computed(() => props.tags.length >= 10)
const tagProgress = computed(() => (props.tags.length / 10) * 100)

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

const tryAddTag = (raw: string) => {
  const t = normalizeTag(raw)
  if (t.length === 0) return
  if (tagCodePointLength(t) > 20) {
    showError($t('user_tags.tag_max_length'))
    return
  }
  if (props.tags.includes(t)) {
    return
  }
  if (props.tags.length >= 10) {
    showError($t('user_tags.limit_reached'))
    return
  }
  emit('add', t)
  freeInput.value = ''
}

const onRemove = (t: string) => {
  if (props.loading) return
  emit('remove', t)
}

const findStoredTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  return props.tags.find((t) => normalizeTag(t) === normalized)
}

const isTagSelected = (tag: string) => findStoredTag(tag) !== undefined

const onMasterClick = (tag: string) => {
  if (props.loading) return
  const stored = findStoredTag(tag)
  if (stored !== undefined) {
    onRemove(stored)
    return
  }
  if (isAtLimit.value) return
  tryAddTag(tag)
}

const genreSelectedCount = (genreTags: readonly string[]) => genreTags.filter((t) => isTagSelected(t)).length

const isMasterSelected = (tag: string) => isTagSelected(tag)

const isMasterPickable = (tag: string) => !props.loading && !isTagSelected(tag) && !isAtLimit.value

const isMasterDisabled = (tag: string) => props.loading || (!isMasterSelected(tag) && isAtLimit.value)
</script>

<template>
  <div class="tag-input">
    <v-alert variant="tonal" color="primary" density="compact" class="text-body-2 mb-6">
      {{ $t('user_tags.dialog_hint') }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" height="2" />

    <v-sheet class="tag-input__hero rounded-lg pa-4 mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-2">{{ $t('user_tags.current_tags_heading') }}</div>
        <div class="text-caption font-weight-medium">{{ $t('user_tags.section_count', { count: tags.length }) }}</div>
      </div>
      <v-progress-linear
        :model-value="tagProgress"
        color="primary"
        height="6"
        rounded
        class="mb-3"
        :aria-label="$t('user_tags.section_count', { count: tags.length })"
      />

      <transition-group v-if="tags.length > 0" name="tag-chip" tag="div" class="d-flex flex-wrap">
        <TagBadge
          v-for="t in tags"
          :key="t"
          :tag="t"
          emphasized
          highlighted
          removable
          :disabled="loading"
          @close="onRemove"
        />
      </transition-group>

      <div v-else class="tag-input__empty text-center py-4">
        <v-icon :icon="mdiTagOutline" color="primary" size="28" class="mb-2 opacity-80" />
        <p class="text-body-2 text-medium-emphasis mb-0">{{ $t('user_tags.section_empty_prompt') }}</p>
      </div>

      <p v-if="isAtLimit" class="text-caption text-medium-emphasis mb-0 mt-3">{{ $t('user_tags.limit_reached') }}</p>
    </v-sheet>

    <div class="text-subtitle-2 mb-2">{{ $t('user_tags.free_input_heading') }}</div>
    <v-text-field
      v-model="freeInput"
      :placeholder="$t('user_tags.free_input_placeholder')"
      :hint="isAtLimit ? $t('user_tags.limit_reached') : $t('user_tags.free_input_hint')"
      persistent-hint
      density="compact"
      variant="outlined"
      hide-details="auto"
      class="mb-6"
      :disabled="loading || isAtLimit"
      :prepend-inner-icon="mdiPencilOutline"
      @keyup.enter="tryAddTag(freeInput)"
    />

    <div class="text-subtitle-2 mb-3">{{ $t('user_tags.master_tags_heading') }}</div>
    <v-expansion-panels variant="accordion" multiple class="tag-input__panels">
      <v-expansion-panel v-for="g in TAG_GENRES" :key="g.genre">
        <v-expansion-panel-title>
          <span>{{ g.genre }}</span>
          <v-chip v-if="genreSelectedCount(g.tags) > 0" size="x-small" color="primary" variant="tonal" class="ml-2">
            {{ genreSelectedCount(g.tags) }}
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-wrap pt-1">
            <TagBadge
              v-for="tag in g.tags"
              :key="tag"
              :tag="tag"
              compact
              :highlighted="isMasterSelected(tag)"
              :pickable="!isMasterSelected(tag) && isMasterPickable(tag)"
              :clickable="!loading && (isMasterSelected(tag) || isMasterPickable(tag))"
              :disabled="isMasterDisabled(tag)"
              @click="onMasterClick(tag)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-snackbar v-model="snackbar" color="error" location="top" timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<style lang="scss" scoped>
.tag-input__hero {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.tag-input__hero :deep(.tag-badge--emphasized.v-chip) {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.tag-input__empty {
  border: 1px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 8px;
}

.tag-input__panels {
  :deep(.v-expansion-panel) {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 8px !important;
    margin-bottom: 8px;

    &::before {
      box-shadow: none;
    }
  }

  :deep(.v-expansion-panel-title) {
    min-height: 48px;
    font-size: 0.875rem;
  }

  :deep(.tag-badge--highlighted.tag-badge--compact.v-chip) {
    background-color: rgba(var(--v-theme-primary), 0.12);
    color: rgb(var(--v-theme-primary));
    transition:
      background-color 0.15s ease,
      transform 0.1s ease;

    &:not(.v-chip--disabled):hover {
      background-color: rgba(var(--v-theme-primary), 0.2);
    }

    &:not(.v-chip--disabled):active {
      transform: scale(0.97);
    }
  }
}

.tag-chip-enter-active,
.tag-chip-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tag-chip-enter-from,
.tag-chip-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.tag-chip-move {
  transition: transform 0.2s ease;
}
</style>
