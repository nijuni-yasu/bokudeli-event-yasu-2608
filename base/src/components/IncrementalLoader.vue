<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { VProgressCircular } from 'vuetify/components'

let observer: IntersectionObserver | null = null
const loadingElement = ref<typeof VProgressCircular | undefined>()

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

const isElementInViewport = (el: HTMLElement | undefined) => {
  if (el == null) {
    return false
  }

  const rect = el.getBoundingClientRect()
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    0 <= rect.bottom &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
    0 <= rect.right
  )
}

const nextLoad = () => {
  if (hasMore.value && isElementInViewport(loadingElement.value?.$el)) {
    emits('load')
  }
}

watch(
  // hasMore の値は props.loadedCount が変化しても変わらないので、
  // 明示的に props.loadedCount を watch する必要がある
  () => [props.totalCount, props.loadedCount],
  () => {
    // props.loadedCount の変化を受けて DOM が再描画された後に isVisible の状態を再評価する必要がある
    // 一般的には nextTick で十分だが、nextTick では IntersectionObserver の動作前になってしまう
    // これを回避するため、 setTimeout で遅延させる
    // TODO もっと良い方法がないか探す
    setTimeout(nextLoad, 100)
  },
)

// 上位の DOM の描画設定によっては
// onMounted & nextTick で loadingElement が undefined になることがある
// これを回避するため、watch で監視する
watch(loadingElement, (newValue) => {
  if (newValue?.$el != null && observer == null) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            nextLoad()
          }
        })
      },
      {
        // オプションでroot、rootMargin、thresholdを設定可能
        threshold: 0.1, // 10%の部分が見えたらトリガー
      },
    )
    observer.observe(newValue.$el)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <v-progress-circular v-show="hasMore" ref="loadingElement" indeterminate color="primary" />
</template>
