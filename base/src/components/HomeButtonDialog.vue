<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import home_button_01 from '@/assets/images/home_button/home_button_01.png'
import home_button_02 from '@/assets/images/home_button/home_button_02.png'

const { t } = useI18n()

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
  return props.closeText ? props.closeText : t('close')
})
</script>
<template>
  <v-dialog v-model="dialog" :max-width="maxWidth">
    <v-card class="pa-3">
      <v-card-title class="text-center text-h3 my-10">{{ t('home_button_dialog.title') }}</v-card-title>
      <v-card-text class="text-h5">
        {{ t('home_button_dialog.step1') }}
        <v-img class="my-3" :src="home_button_01" />
      </v-card-text>
      <v-card-text class="text-h5">
        {{ t('home_button_dialog.step2') }}
        <v-img class="my-3" :src="home_button_02" />
      </v-card-text>
      <v-card-text class="text-h5">
        {{ t('home_button_dialog.step3') }}
      </v-card-text> 

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="dialog = false">{{ closeText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style lang="scss" scoped></style>
