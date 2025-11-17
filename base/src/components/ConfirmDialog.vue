<script setup lang="ts">
/**
 * Deprecated
 * Please use `v-dialog` directly
 */
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  isConfirm?: boolean
  title?: string
  okText?: string
  cancelText?: string
  okClick?: () => void
  cancelClick?: () => void | Promise<void>
  okLoadingState?: boolean
  cancelLoadingState?: boolean
  maxWidth?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
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
    <v-card class="pa-4">
      <v-card-title class="text-h5 mb-3">{{ props.title }}</v-card-title>
      <v-card-text><slot></slot></v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="props.isConfirm"
          color="secondary"
          :loading="props.cancelLoadingState"
          :disabled="props.okLoadingState"
          @click="clickCancelHandler()"
        >
          {{ props.cancelText ?? 'キャンセル' }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="props.okLoadingState"
          :disabled="props.cancelLoadingState"
          @click="clickOkHandler()"
          >{{ props.okText ?? 'OK' }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
