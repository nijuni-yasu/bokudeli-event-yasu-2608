<script setup lang="ts">
import PartnerMenu from '@/schemes/partnerMenu'

const props = defineProps<{
  modelValue: boolean
  menu: PartnerMenu
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const countOptions = Array.from({ length: 10 }, (_, i) => i + 1)
const closeDialog = () => {
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="550px" @click:outside="closeDialog()">
    <v-card class="pa-sm-10 px-5 py-1 text-center">
      <v-img :src="menu.imageUrl" class="ma-5" aspect-ratio="1" cover></v-img>
      <v-card-title class="text-left text-h4 pb-3">
        {{ menu.name }}
      </v-card-title>
      <v-card-text class="text-left pb-2">
        {{ menu.description }}
      </v-card-text>
      <v-card-text class="text-right text-h4 pb-5"> ¥ {{ menu.price }} </v-card-text>
      <v-row class="mx-3 mb-2">
        <v-select :items="countOptions" dense outlined filled label="個数"></v-select>
      </v-row>
      <v-row class="mx-3 my-2">
        <v-textarea outlined dense rows="1" label="注記を追加"></v-textarea>
      </v-row>
      <v-row class="justify-center mx-3 my-2">
        <v-btn class="justify-center mx-3 align-self-center" rounded size="x-large" color="primary" @click="closeDialog()">
          カートに追加する
        </v-btn>
        <v-btn class="justify-center mx-3 align-self-center" rounded variant="outlined" color="secondary" @click="closeDialog()">
          閉じる
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
