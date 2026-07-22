<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>

<template>
  <div class="admin-readonly-item d-flex flex-column flex-sm-row ga-1 ga-sm-4 py-2">
    <div class="admin-readonly-item__label text-body-2 text-medium-emphasis">{{ label }}</div>
    <div class="admin-readonly-item__value text-body-1">{{ value }}</div>
  </div>
</template>

<style scoped lang="scss">
.admin-readonly-item__label {
  min-width: 10rem;
  flex-shrink: 0;
}
</style>
