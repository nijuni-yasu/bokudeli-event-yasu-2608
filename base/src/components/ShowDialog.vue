<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  closeText?: string
  maxWidth?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const maxWidth = computed(() => {
  return props.maxWidth ? props.maxWidth : '600px'
})
const closeText = computed(() => {
  return props.closeText ? props.closeText : '閉じる'
})
</script>
<template>
  <v-dialog v-model="dialog" :max-width="maxWidth">
    <v-card>
      <v-card-text><slot></slot></v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="dialog = false">{{ closeText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style lang="scss" scoped></style>
