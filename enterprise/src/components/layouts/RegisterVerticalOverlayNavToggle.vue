<script setup lang="ts">
import { onBeforeUnmount, onMounted, type PropType } from 'vue'
import { registerVerticalOverlayNavClose } from '@/composable/useVerticalOverlayNavClose'

const props = defineProps({
  toggle: {
    // eslint-disable-next-line no-unused-vars -- PropType コールバックの引数名（型定義のみ）
    type: Function as PropType<(value: boolean) => void>,
    required: true,
  },
})

onMounted(() => {
  registerVerticalOverlayNavClose(props.toggle)
})

onBeforeUnmount(() => {
  registerVerticalOverlayNavClose(null)
})
</script>

<template>
  <span class="d-none" aria-hidden="true" />
</template>
