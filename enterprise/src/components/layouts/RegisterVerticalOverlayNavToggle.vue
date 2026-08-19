<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import {
  registerVerticalOverlayNavClose,
  unregisterVerticalOverlayNavClose,
  type VerticalOverlayNavToggleFn,
} from '@/composable/useVerticalOverlayNavClose'

const props = defineProps<{
  toggle: VerticalOverlayNavToggleFn
}>()

onMounted(() => {
  registerVerticalOverlayNavClose(props.toggle)
})

onBeforeUnmount(() => {
  unregisterVerticalOverlayNavClose(props.toggle)
})
</script>

<template>
  <span class="d-none" aria-hidden="true" />
</template>
