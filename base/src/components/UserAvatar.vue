<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { type VAvatar } from 'vuetify/lib/components/index.mjs'
import defaultAvatar from '@shokujii/base/assets/images/avatars/default_profile.jpeg'
import { User } from '@shokujii/common/schemas/User.js'
import { buildThumbnailsLinks, type Sizes } from '@shokujii/common/utils/buildThumbnailsLinks.js'
import { FIREBASE_STORAGE_BASE_URL } from '@shokujii/base/firebase.js'

const MAX_RETRIES = 10
const RETRY_DELAY = 1000

const props = defineProps<{
  user: User | string | null
  size?: number
}>()

const calcAvatarSize = (size: number | undefined): Sizes => {
  if (size == null) return 'large'
  if (size <= 50) return 'small'
  if (size <= 100) return 'medium'
  return 'large'
}

const avatar = computed(() => {
  if (typeof props.user === 'string') {
    return props.user
  } else if (props.user === null || props.user.user_image_url === '') {
    return defaultAvatar
  }
  const thumbnails = buildThumbnailsLinks(
    props.user.user_id,
    new URL(props.user.user_image_url),
    FIREBASE_STORAGE_BASE_URL,
  )
  return thumbnails?.[calcAvatarSize(size.value)] ?? props.user.user_image_url
})
const initial = computed(() => {
  if (typeof props.user === 'string') {
    // URLの場合はイニシャル表示しない
    if (props.user.startsWith('http') || props.user.startsWith('blob:')) {
      return undefined
    }
    return props.user.slice(0, 1)
  }
  return undefined
})

const avatarElement = ref<VAvatar>()
const elementSize = ref<number | undefined>(undefined)
const size = computed(() => props.size ?? elementSize.value)

const reloadKey = ref(0)
let retries = 0
const onError = () => {
  if (retries < MAX_RETRIES) {
    retries++
    console.warn(`画像の再取得を試みます (${retries}/${MAX_RETRIES})`)
    setTimeout(() => {
      // キャッシュを回避するためクエリ文字列を付与
      reloadKey.value++
    }, RETRY_DELAY)
  } else {
    console.error('画像の取得に失敗しました')
  }
}

// 画面をリサイズした際に適切にサイズを変更する
const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0]
  if (entry) {
    const { width, height } = entry.contentRect
    // 一度表示した後、非表示にした場合、は width, hight 共に 0 になり、
    // その後表示しても ResizeObserver が動作しないので無視する
    if (width !== 0 && height !== 0) {
      elementSize.value = Math.max(width, height)
    }
  }
})

onMounted(async () => {
  await nextTick()
  if (avatarElement.value?.$el != null) {
    resizeObserver.observe(avatarElement.value.$el)
  }
})

onUnmounted(() => {
  resizeObserver.disconnect()
})
</script>

<template>
  <v-avatar ref="avatarElement" :size="size" :color="initial != null ? 'primary' : 'transparent'">
    <template v-if="initial != null">{{ initial }}</template>
    <v-img v-else :src="avatar" :key="reloadKey" cover @error="onError" />
    <slot />
  </v-avatar>
</template>
