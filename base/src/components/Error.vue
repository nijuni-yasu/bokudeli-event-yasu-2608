<script setup lang="ts">
defineProps<{
  code: string
}>()
</script>

<template>
  <div>
    <h1>{{ code }}</h1>
  </div>
</template>
