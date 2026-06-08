<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

let observer: IntersectionObserver | null = null
const loadingElement = ref<HTMLElement | null>(null)

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  totalCount: number
  loadedCount: number
}>()

const emits = defineEmits<{
  load: []
}>()

const hasMore = computed(() => props.totalCount > props.loadedCount)

/** 少し下にあっても「追読み可能」とみなす（短い一覧でインジケータがビューポート外に落ちる場合の取りこぼし防止） */
const VIEWPORT_CHAIN_MARGIN_PX = 800

const isElementInViewport = (el: HTMLElement | null | undefined) => {
  if (el == null) {
    return false
  }

  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  const vw = window.innerWidth || document.documentElement.clientWidth
  const relaxedBottom = vh + VIEWPORT_CHAIN_MARGIN_PX
  return rect.top <= relaxedBottom && rect.bottom >= -VIEWPORT_CHAIN_MARGIN_PX && rect.left <= vw && 0 <= rect.right
}

const nextLoad = () => {
  if (hasMore.value && isElementInViewport(loadingElement.value)) {
    emits('load')
  }
}

watch(
  () => [props.totalCount, props.loadedCount],
  () => {
    // props 変化を受けて DOM が再描画された後に isVisible の状態を再評価する必要がある
    // 一般的には nextTick で十分だが、nextTick では IntersectionObserver の動作前になってしまう
    // これを回避するため、 setTimeout で遅延させる
    setTimeout(nextLoad, 100)
  },
)

// 上位の DOM の描画設定によっては
// onMounted & nextTick で loadingElement が undefined になることがある
// これを回避するため、watch で監視する
watch(loadingElement, (newValue) => {
  if (newValue != null && observer == null) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            nextLoad()
          }
        })
      },
      {
        rootMargin: `0px 0px ${VIEWPORT_CHAIN_MARGIN_PX}px 0px`,
        threshold: 0.1, // 10%の部分が見えたらトリガー
      },
    )
    observer.observe(newValue)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div v-show="hasMore" ref="loadingElement" class="incremental-loader-anchor text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>

<style scoped>
.incremental-loader-anchor {
  min-height: 48px;
  padding: 20px 0;
}
</style>
