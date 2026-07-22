<script setup lang="ts">
defineProps<{
  message: string
  description?: string
}>()
</script>

<template>
  <div class="text-center py-12 px-4">
    <p class="text-body-1 mb-2">{{ message }}</p>
    <p v-if="description != null && description !== ''" class="text-body-2 text-medium-emphasis mb-4">
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="d-flex ga-2 justify-center flex-wrap">
      <slot name="actions" />
    </div>
  </div>
</template>
