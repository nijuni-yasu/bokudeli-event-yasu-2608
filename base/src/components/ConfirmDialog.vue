<script setup lang="ts">
/**
 * Deprecated
 * Please use `v-dialog` directly
 */
const props = defineProps<{
  modelValue: boolean
  isConfirm?: boolean
  title?: string
  okText?: string
  cancelText?: string
  okClick?: () => void
  cancelClick?: () => void | Promise<void>
  maxWidth?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
}

const clickOkHandler = () => {
  if (props.okClick) {
    props.okClick()
  }
  closeDialog()
}

const clickCancelHandler = () => {
  if (props.cancelClick) {
    props.cancelClick()
  }
  closeDialog()
}
</script>

<template>
  <v-dialog v-model="dialog" persistent :max-width="props.maxWidth ? props.maxWidth : '600px'">
    <v-card>
      <v-card-title v-if="props.title">{{ props.title }}</v-card-title>
      <v-card-text><slot></slot></v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn v-if="props.isConfirm" color="secondary" @click="clickCancelHandler()">
          {{ props.cancelText ?? 'キャンセル' }}
        </v-btn>
        <v-btn color="primary" @click="clickOkHandler()">{{ props.okText ?? 'OK' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
