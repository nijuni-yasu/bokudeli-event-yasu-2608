<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useCommunityStore, type BokudeliAlbumItem, type CommunityStore } from '@shokujii/base/stores/community.js'
import { getCommunityAlbumItemStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { validateImageFile } from '@shokujii/base/utils/image.js'
import { ALLOWED_IMAGE_ACCEPT_ATTR } from '@shokujii/common/constants/imageMimeTypes.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { mdiClose, mdiDragVertical, mdiPlus } from '@mdi/js'

const { t: $t } = useI18n()
const notification = useNotification()
const route = useRoute()

const communityAccount = route.params.communityAccount as string
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const community = computed(() => communityStore.community)

const items = computed(() => communityStore.albumItems ?? [])
const hasItems = computed(() => items.value.length > 0)

const thumbUrls = computed(() => {
  const cid = community.value?.community_id
  if (cid == null) return new Map<string, string>()
  return new Map(
    items.value.map((item) => {
      const base = convertStoragePathToURL(getCommunityAlbumItemStoragePath(cid, item.id))
      return [item.id, `${base}&t=${item.updated_at}`]
    }),
  )
})

const sortIds = ref<string[]>([])
const originalSortIds = ref<string[]>([])
watch(
  items,
  (newItems) => {
    const ids = newItems.map((i) => i.id)
    const synced = sortIds.value.length === ids.length && sortIds.value.every((id, index) => id === ids[index])
    if (!synced) {
      sortIds.value = [...ids]
      originalSortIds.value = [...ids]
    }
  },
  { immediate: true },
)

const sortedItems = computed<BokudeliAlbumItem[]>({
  get: () =>
    sortIds.value
      .map((id) => items.value.find((i) => i.id === id))
      .filter((item): item is BokudeliAlbumItem => item != null),
  set: (newItems) => {
    sortIds.value = newItems.map((i) => i.id)
  },
})

const captions = reactive<Record<string, string>>({})

watch(
  items,
  (list) => {
    for (const it of list) {
      if (captions[it.id] === undefined) {
        captions[it.id] = it.album_caption
      }
    }
  },
  { immediate: true },
)

const saveSortOrder = async () => {
  try {
    const ids = sortedItems.value.map((m) => m.id)
    const orig = originalSortIds.value
    const changed = ids.length === orig.length && ids.some((id, index) => id !== orig[index])
    if (changed) {
      await communityStore.updateAlbumSortOrder(ids)
      originalSortIds.value = [...ids]
      notification.show($t('manage.community.album.sort_saved'), 'success')
    }
  } catch (e) {
    console.error(e)
    notification.show($t('manage.community.album.sort_save_error'), 'error')
  }
}

const saveCaption = async (id: string) => {
  try {
    const next = captions[id] ?? ''
    const current = items.value.find((i) => i.id === id)?.album_caption ?? ''
    if (next === current) {
      return
    }
    await communityStore.updateAlbumCaption(id, next)
  } catch (e) {
    console.error(e)
    notification.show($t('manage.community.album.caption_save_error'), 'error')
  }
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const replaceInputRef = ref<HTMLInputElement | null>(null)
const replaceTargetId = ref<string | null>(null)
const uploadProgress = ref<{ current: number; total: number } | null>(null)

const MAX_BYTES = 10 * 1024 * 1024

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const onFilesSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  if (files.length === 0) {
    return
  }
  uploadProgress.value = { current: 0, total: files.length }
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    const validation = validateImageFile(file)
    if (!validation.ok) {
      notification.show($t(validation.messageKey), 'error')
      uploadProgress.value = { current: i + 1, total: files.length }
      continue
    }
    if (file.size > MAX_BYTES) {
      notification.show($t('manage.community.album.file_too_large'), 'error')
      uploadProgress.value = { current: i + 1, total: files.length }
      continue
    }
    try {
      await communityStore.addAlbumItem(file)
    } catch (err) {
      console.error(err)
      notification.show($t('manage.community.album.upload_error'), 'error')
    }
    uploadProgress.value = { current: i + 1, total: files.length }
  }
  uploadProgress.value = null
}

const openReplace = (id: string) => {
  replaceTargetId.value = id
  replaceInputRef.value?.click()
}

const onThumbKeydown = (e: KeyboardEvent, id: string) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openReplace(id)
  }
}

const onReplaceFile = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const id = replaceTargetId.value
  input.value = ''
  replaceTargetId.value = null
  if (file == null || id == null) {
    return
  }
  const validation = validateImageFile(file)
  if (!validation.ok) {
    notification.show($t(validation.messageKey), 'error')
    return
  }
  if (file.size > MAX_BYTES) {
    notification.show($t('manage.community.album.file_too_large'), 'error')
    return
  }
  try {
    await communityStore.replaceAlbumImage(id, file)
    notification.show($t('manage.community.album.replace_success'), 'success')
  } catch (err) {
    console.error(err)
    notification.show($t('manage.community.album.replace_error'), 'error')
  }
}

const deleteTargetId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const requestDelete = (id: string) => {
  deleteTargetId.value = id
  deleteDialogOpen.value = true
}

const confirmDelete = async () => {
  const id = deleteTargetId.value
  deleteDialogOpen.value = false
  if (id == null) {
    return
  }
  try {
    await communityStore.deleteAlbumItem(id)
    deleteTargetId.value = null
  } catch (e) {
    console.error(e)
    notification.show($t('manage.community.album.delete_error'), 'error')
  }
}
</script>

<template>
  <v-container class="manage-container pb-10">
    <input
      ref="fileInputRef"
      type="file"
      class="d-none"
      :accept="ALLOWED_IMAGE_ACCEPT_ATTR"
      multiple
      @change="onFilesSelected"
    />
    <input
      ref="replaceInputRef"
      type="file"
      class="d-none"
      :accept="ALLOWED_IMAGE_ACCEPT_ATTR"
      @change="onReplaceFile"
    />

    <v-card class="pa-10 mb-10">
      <v-row>
        <v-card-text class="pa-3 title">
          <div>{{ $t('manage.community.album.page_title') }}</div>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="pa-3 description">
          <div class="album-help mb-4">
            <div class="album-help__section">
              <div class="album-help__heading">{{ $t('manage.community.album.help_heading_what') }}</div>
              <p class="album-help__p" v-html="$t('manage.community.album.help_what')"></p>
            </div>
            <div v-if="hasItems" class="album-help__section album-help__section--after-what">
              <div class="album-help__heading">{{ $t('manage.community.album.help_heading_how') }}</div>
              <p class="album-help__p mb-0" v-html="$t('manage.community.album.help_how')"></p>
            </div>
          </div>
          <div class="d-flex flex-wrap align-center ga-4">
            <v-btn color="primary" size="large" :prepend-icon="mdiPlus" @click="openFilePicker">
              {{ $t('manage.community.album.add_images') }}
            </v-btn>
            <span v-if="uploadProgress != null" class="text-medium-emphasis">
              {{
                $t('manage.community.album.uploading', {
                  current: uploadProgress.current,
                  total: uploadProgress.total,
                })
              }}
            </span>
          </div>
        </v-card-text>
      </v-row>
    </v-card>

    <v-card v-if="hasItems" class="pa-4">
      <draggable
        v-model="sortedItems"
        class="album-grid"
        item-key="id"
        handle=".album-drag-handle"
        ghost-class="album-ghost"
        chosen-class="album-chosen"
        @end="saveSortOrder"
      >
        <div v-for="item in sortedItems" :key="item.id" class="album-item-wrapper">
          <v-card class="album-item-card pa-2 h-100 d-flex flex-column" flat border>
            <div class="album-item-toolbar d-flex align-center px-1 py-1">
              <button
                type="button"
                class="album-drag-handle d-flex align-center justify-center"
                :aria-label="$t('manage.community.album.help_drag')"
              >
                <v-icon :icon="mdiDragVertical" size="22" class="text-medium-emphasis" />
              </button>
            </div>
            <div class="position-relative">
              <div
                class="album-thumb-hit rounded"
                role="button"
                tabindex="0"
                :aria-label="$t('manage.community.album.help_click_replace')"
                @click="openReplace(item.id)"
                @keydown="onThumbKeydown($event, item.id)"
              >
                <v-img :src="thumbUrls.get(item.id)" aspect-ratio="1.91" cover min-height="120" class="rounded" />
              </div>
              <v-btn
                class="position-absolute album-thumb-remove"
                style="top: 4px; right: 4px; z-index: 1"
                size="x-small"
                variant="flat"
                color="grey-darken-1"
                :ripple="false"
                :icon="mdiClose"
                :aria-label="$t('manage.community.album.delete')"
                @click.stop="requestDelete(item.id)"
              />
            </div>
            <v-textarea
              v-model="captions[item.id]"
              class="mt-2"
              density="compact"
              rows="2"
              :label="$t('manage.community.album.caption_label')"
              hide-details
              @blur="saveCaption(item.id)"
            />
          </v-card>
        </div>
      </draggable>
    </v-card>

    <confirm-dialog v-model="deleteDialogOpen" :is-confirm="true" :ok-click="confirmDelete">
      {{ $t('manage.community.album.delete_confirm') }}
    </confirm-dialog>
  </v-container>
</template>

<style scoped lang="scss">
/* レター・請求書払いのヒントカードと同じ見出し・本文スタイル */
.title {
  font-size: 22px;
  font-weight: 700;
  text-align: left;
}

.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.album-help {
  line-height: 1.65;
}

.album-help__section--after-what {
  margin-top: 1rem;
}

.album-help__heading {
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.album-help__p {
  margin: 0 0.5rem 0.5rem;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  gap: 1rem;
}

.album-item-wrapper {
  min-width: 0;
}

.album-item-card {
  cursor: default;
}

.album-drag-handle {
  flex: 0 0 auto;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: grab;
  color: inherit;

  &:active {
    cursor: grabbing;
  }
}

.album-item-toolbar {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.album-thumb-hit {
  cursor: pointer;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  }
}

.album-thumb-remove {
  min-width: 1.75rem !important;
  width: 1.75rem !important;
  height: 1.75rem !important;
  padding: 0 !important;
  border-radius: 999px !important;
  color: rgba(var(--v-theme-on-surface), 0.58) !important;
  background-color: rgba(var(--v-theme-surface), 0.92) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);

  /* primary のホバーオーバーレイを使わず、グレーだけ少し濃くする */
  &:deep(.v-btn__overlay) {
    background-color: rgb(var(--v-theme-on-surface)) !important;
    opacity: 0 !important;
    transition: opacity 0.15s ease;
  }

  &:hover {
    color: rgba(var(--v-theme-on-surface), 0.78) !important;
    background-color: rgba(var(--v-theme-surface), 1) !important;
  }

  &:hover :deep(.v-btn__overlay) {
    opacity: 0.1 !important;
  }

  &:focus-visible :deep(.v-btn__overlay) {
    opacity: 0.12 !important;
  }
}

:deep(.album-ghost) {
  opacity: 0.6;
}

:deep(.album-chosen) {
  cursor: grabbing !important;
}
</style>
