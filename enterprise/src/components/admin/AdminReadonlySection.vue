<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="admin-readonly-section">
    <div class="text-subtitle-1 mb-3">{{ title }}</div>
    <slot />
  </div>
</template>
