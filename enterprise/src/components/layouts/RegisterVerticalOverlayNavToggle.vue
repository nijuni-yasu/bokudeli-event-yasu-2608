<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import {
  registerVerticalOverlayNavClose,
  type VerticalOverlayNavToggleFn,
} from '@/composable/useVerticalOverlayNavClose'

const props = defineProps<{
  toggle: VerticalOverlayNavToggleFn
}>()

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
