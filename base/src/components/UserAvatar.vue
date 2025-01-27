<script setup lang="ts">
import { FirestoredUser } from '@/schemes/storedUser'
import { type VAvatar } from 'vuetify/lib/components/index.mjs'
import avatar1 from '@images/avatars/default_profile.jpeg'

const props = defineProps<{ user: FirestoredUser | string | null; size?: number }>()

const calcAvatarSize = (size: number | undefined) => {
  if (size == null) return 'large'
  if (size <= 50) return 'small'
  if (size <= 100) return 'medium'
  return 'large'
}

const hasError = ref(false)

const avatar = computed(
  // @ts-expect-error
  () => props.user?.user_thumb_image_urls?.[calcAvatarSize(size.value)] ?? props.user?.user_image_url ?? avatar1,
)
const initial = computed(() => (typeof props.user === 'string' ? props.user.slice(0, 1) : undefined))

const avatarElement = ref<VAvatar>()
const elementSize = ref<number | undefined>(undefined)
const size = computed(() => props.size ?? elementSize.value)

// 画面をリサイズした際に適切にサイズを変更する
const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0]
  if (entry) {
    const { width, height } = entry.contentRect
    // 一度表示した後、非表示にした場合、は width, hight 共に 0 になり、
    // その後表示しても ResizeObserver が動作しないので無視する
    if (width !== 0  && height !== 0) {
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
    <v-img v-else :src="avatar" cover @error="hasError = true" />
    <slot />
  </v-avatar>
</template>
