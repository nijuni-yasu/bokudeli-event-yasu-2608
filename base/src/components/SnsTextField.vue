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
    // query は facebook 等で必要なケースがあるので、削除しない
    // https://github.com/nijuniinc/bokudeli-event-new/pull/511#issuecomment-2391223765
    // model.value = v.replace(/\/?(\?.+)*$/, '')
  },
  { immediate: true },
)
</script>

<template>
  <v-text-field v-model="model" :prefix="prefix" />
</template>
