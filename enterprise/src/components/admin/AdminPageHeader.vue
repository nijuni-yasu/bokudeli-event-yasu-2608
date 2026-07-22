<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3">
    <div>
      <h1 class="text-h4 mt-4 mb-2">{{ title }}</h1>
      <p v-if="description != null && description !== ''" class="text-body-2 text-medium-emphasis mt-2 mb-0">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="d-flex ga-2 flex-wrap">
      <slot name="actions" />
    </div>
  </div>
</template>
