<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { mdiImageMultiple } from '@mdi/js'
import AlbumLightbox, { type AlbumLightboxSlide } from '@shokujii/base/components/AlbumLightbox.vue'

/** 表示順が確定したアルバム 1 件分。ストアの community_album_item_ids 順で並べた配列を渡す */
export type PublicAlbumGalleryItem = { src: string; title?: string }

const props = withDefaults(
  defineProps<{
    coverUrl: string
    /** ライトボックス先頭スライドのタイトル。未指定は空 */
    coverTitle?: string
    albums: PublicAlbumGalleryItem[]
    /** ライトボックス末尾に追加（例: イベント説明 TinyMCE 内の画像）。順序はカバー → albums → 本配列 */
    lightboxAppendItems?: PublicAlbumGalleryItem[]
    maxThumbnails?: number
  }>(),
  { maxThumbnails: 4, coverTitle: '', lightboxAppendItems: () => [] },
)

const { t: $t } = useI18n()
const display = useDisplay()

/** スマホ幅ではすべての写真ボタンをアイコンのみの円形にする */
const isXs = computed(() => display.xs.value)

/** サムネイル行のスロット数: スマホ 3、それ以外 4 */
const visibleThumbSlotCount = computed(() => (isXs.value ? 3 : 4))

const hasAlbums = computed(() => props.albums.length > 0)

/** カバー下のサムネ行。slot i は albums[i] があれば画像、なければグレー */
const thumbSlots = computed(() =>
  Array.from({ length: visibleThumbSlotCount.value }, (_, slotIndex) => ({
    slotIndex,
    item: slotIndex < props.maxThumbnails ? (props.albums[slotIndex] ?? null) : null,
  })),
)

const lightboxImgs = computed<AlbumLightboxSlide[]>(() => {
  const cover: AlbumLightboxSlide = { src: props.coverUrl, title: props.coverTitle ?? '' }
  const albumSlides = props.albums.map((a) => ({ src: a.src, title: a.title ?? '' }))
  const appendSlides = (props.lightboxAppendItems ?? []).map((a) => ({ src: a.src, title: a.title ?? '' }))
  return [cover, ...albumSlides, ...appendSlides]
})

/** 仕様: アルバムが 1 件以上のときのみ（append だけでは出さない） */
const showShowAllPhotosButton = computed(() => props.albums.length > 0)

const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

const openAt = (index: number) => {
  lightboxIndex.value = index
  lightboxVisible.value = true
}

const onThumbClick = (slotIndex: number) => {
  if (slotIndex >= visibleThumbSlotCount.value || slotIndex >= props.maxThumbnails || props.albums[slotIndex] == null) {
    return
  }
  openAt(1 + slotIndex)
}

const onCoverKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openAt(0)
  }
}

const onThumbKeydown = (e: KeyboardEvent, slotIndex: number) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onThumbClick(slotIndex)
  }
}
</script>

<template>
  <div class="public-album-gallery">
    <div v-if="hasAlbums" class="public-album-gallery__split">
      <div class="public-album-gallery__cover-wrap">
        <div
          class="public-album-gallery__media-trigger rounded"
          role="button"
          tabindex="0"
          :aria-label="$t('album.gallery_open_cover')"
          @click="openAt(0)"
          @keydown="onCoverKeydown"
        >
          <v-img
            class="ma-0 pa-0 rounded public-album-gallery__cover"
            cover
            aspect-ratio="1.91"
            :src="coverUrl"
            alt=""
          />
        </div>
      </div>
      <div class="public-album-gallery__thumbs">
        <div
          v-for="{ slotIndex, item } in thumbSlots"
          :key="slotIndex"
          class="public-album-gallery__slot"
          :class="isXs ? 'public-album-gallery__slot--3' : 'public-album-gallery__slot--4'"
        >
          <div
            v-if="item != null"
            class="public-album-gallery__media-trigger rounded"
            role="button"
            tabindex="0"
            :aria-label="$t('album.gallery_open_album_photo')"
            @click="onThumbClick(slotIndex)"
            @keydown="(e) => onThumbKeydown(e, slotIndex)"
          >
            <v-img :src="item.src" cover aspect-ratio="1.91" class="rounded public-album-gallery__thumb" alt="" />
          </div>
          <div v-else class="public-album-gallery__placeholder rounded" />
        </div>
      </div>
    </div>
    <v-row v-else>
      <v-col>
        <div
          class="public-album-gallery__media-trigger rounded"
          role="button"
          tabindex="0"
          :aria-label="$t('album.gallery_open_cover')"
          @click="openAt(0)"
          @keydown="onCoverKeydown"
        >
          <v-img
            class="ma-0 pa-0 rounded public-album-gallery__cover-only"
            cover
            aspect-ratio="1.91"
            :src="coverUrl"
            alt=""
          />
        </div>
      </v-col>
    </v-row>
    <template v-if="showShowAllPhotosButton">
      <v-btn
        v-if="isXs"
        icon
        class="public-album-gallery__show-all public-album-gallery__show-all--icon-only"
        variant="flat"
        size="small"
        :aria-label="$t('album.show_all_photos')"
        @click.stop="openAt(0)"
      >
        <v-icon :icon="mdiImageMultiple" />
      </v-btn>
      <v-btn
        v-else
        class="public-album-gallery__show-all text-none"
        variant="flat"
        rounded="lg"
        :append-icon="mdiImageMultiple"
        @click.stop="openAt(0)"
      >
        {{ $t('album.show_all_photos') }}
      </v-btn>
    </template>
    <AlbumLightbox v-model:visible="lightboxVisible" :imgs="lightboxImgs" :index="lightboxIndex" />
  </div>
</template>

<style scoped lang="scss">
.public-album-gallery {
  position: relative;
}

.public-album-gallery__media-trigger {
  cursor: pointer;
  display: block;
  outline: none;
}

.public-album-gallery__media-trigger:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.public-album-gallery__cover,
.public-album-gallery__cover-only {
  pointer-events: none;
}

/* カバー全幅の下にサムネイル行を横並び */
.public-album-gallery__split {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.public-album-gallery__cover-wrap {
  width: 100%;
}

.public-album-gallery__thumbs {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
}

/* 各スロット幅: gap 8px 分を引いて列数で割る */
.public-album-gallery__slot {
  min-width: 0;
  overflow: hidden;
}

.public-album-gallery__slot--3 {
  flex: 0 0 calc((100% - 16px) / 3);
  max-width: calc((100% - 16px) / 3);
}

.public-album-gallery__slot--4 {
  flex: 0 0 calc((100% - 24px) / 4);
  max-width: calc((100% - 24px) / 4);
}

.public-album-gallery__thumb {
  width: 100%;
}

.public-album-gallery__placeholder {
  width: 100%;
  aspect-ratio: 1200 / 630;
  background: rgb(var(--v-theme-grey-200));
  pointer-events: none;
}

.public-album-gallery__show-all {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  color: rgb(var(--v-theme-surface));
  background: rgba(0, 0, 0, 0.55) !important;
}

.public-album-gallery__show-all--icon-only {
  border-radius: 50%;
}
</style>
