<script setup lang="ts">
import { FirestoredUser } from '@/schemes/storedUser';
import { type VAvatar } from 'vuetify/lib/components/index.mjs';
import avatar1 from '@images/avatars/default_profile.jpeg'

const props = defineProps<{ user: FirestoredUser | null, size?: number }>()

const calcAvatarSize = (size: number | undefined) => {
  if (size == null) return 'large'
  if (size <= 50) return 'small'
  if (size <= 100) return 'medium'
  return 'large'
}

const hasError = ref(false)
const avatar = computed(() => hasError.value || props.user == null ? avatar1 :
  props.user.user_thumb_image_urls?.[calcAvatarSize(size.value)] ??
  props.user.user_image_url ??
  avatar1
)

const avatarElement = ref<VAvatar>(null)
const elementSize = ref<number | undefined>(undefined)
const size = computed(() => props.size ?? elementSize.value)

const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0]
  if (entry) {
    const { width, height } = entry.contentRect
    elementSize.value = Math.max(width, height)
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
  <v-avatar ref="avatarElement" :size="size">
    <v-img :src="avatar" cover @error="hasError = true"/>
    <slot />
  </v-avatar>
</template>
