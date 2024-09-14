<script setup lang="ts">
const model = defineModel<string | null>({ required: true })

const props = defineProps<{
  prefix: string
}>()

watch(
  model,
  (v) => {
    if (v == null) {
      return
    }
    if (v.startsWith(props.prefix)) {
      model.value = v.replace(props.prefix, '')
    }
    model.value = v.replace(/\/?(\?.+)*$/, '')
  },
  { immediate: true },
)
</script>

<template>
  <v-text-field v-model="model" :prefix="prefix" />
</template>
