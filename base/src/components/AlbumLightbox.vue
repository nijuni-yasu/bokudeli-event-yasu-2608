<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VueEasyLightbox from 'vue-easy-lightbox'
import 'vue-easy-lightbox/external-css/vue-easy-lightbox.css'

export type AlbumLightboxSlide = { src: string; title?: string }

const props = withDefaults(
  defineProps<{
    visible: boolean
    imgs: AlbumLightboxSlide[]
    /** 表示開始インデックス（0 始まり） */
    index?: number
    /** 画像下のキャプション（title）を表示する */
    showCaption?: boolean
    /** 複数枚時の「1/N枚」カウンター表示 */
    showCounter?: boolean
  }>(),
  { showCaption: true, showCounter: true },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { t } = useI18n()

const lightboxImgs = computed(() =>
  props.imgs.map((img) => ({
    src: img.src,
    title: props.showCaption ? (img.title ?? '') : '',
  })),
)

const displayIndex = ref(0)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      displayIndex.value = props.index ?? 0
    }
  },
)

watch(
  () => props.index,
  (i) => {
    if (props.visible) {
      displayIndex.value = i ?? 0
    }
  },
)

const totalSlides = computed(() => props.imgs.length)

const moveDisabled = computed(() => totalSlides.value <= 1)

const counterLabel = computed(() =>
  totalSlides.value === 0
    ? ''
    : t('album.lightbox_count', { current: displayIndex.value + 1, total: totalSlides.value }),
)

const onIndexChange = (_oldIndex: number, newIndex: number) => {
  displayIndex.value = newIndex
}

const onHide = () => {
  emit('update:visible', false)
}
</script>

<template>
  <VueEasyLightbox
    :visible="props.visible"
    :imgs="lightboxImgs"
    :index="displayIndex"
    teleport="body"
    :zoom-disabled="true"
    :rotate-disabled="true"
    :move-disabled="moveDisabled"
    @hide="onHide"
    @on-index-change="onIndexChange"
  >
    <!-- 拡大・リサイズ・回転のデフォルトツールバーを出さない -->
    <template #toolbar />
  </VueEasyLightbox>
  <Teleport to="body">
    <div
      v-if="props.visible && totalSlides > 1 && props.showCounter"
      class="album-lightbox__counter"
      aria-live="polite"
    >
      {{ counterLabel }}
    </div>
  </Teleport>
</template>

<style lang="scss">
/* vue-easy-lightbox は teleport するためキャプションはグローバル指定（当プロジェクトでは本コンポーネントのみ VueEasyLightbox を使用） */
.vel-modal .vel-img-title:empty {
  display: none !important;
}

.vel-modal .vel-img-title {
  bottom: 92px;
  font-size: 22px !important;
  line-height: 1.45 !important;
  max-width: 90%;
  white-space: normal !important;
  color: rgba(255, 255, 255, 0.92) !important;
  opacity: 1 !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}

.album-lightbox__counter {
  position: fixed;
  bottom: 56px;
  left: 50%;
  z-index: 10000;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
  line-height: 1.2;
  pointer-events: none;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}
</style>
