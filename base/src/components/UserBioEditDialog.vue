<script setup lang="ts">
import { ref } from 'vue'
import { User } from '@shokujii/common/schemas/User.js'
import SnsTextField from './SnsTextField.vue'

interface Props {
  modelValue: boolean
  userData: User
}

interface Emit {
  submit: [value: User, image?: File]
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const userDataDraft = ref<User>(new User(props.userData.id, props.userData))
const userImage = ref<File | undefined>(undefined)

const dialog = defineModel<boolean>()

const readImageFiles = (files: File | File[]) => {
  if (files instanceof File) files = [files]
  if (files.length === 0) return
  userImage.value = files[0]
}

const closeDialog = () => {
  userImage.value = undefined
  dialog.value = false
}

const onFormSubmit = async () => {
  emit('submit', userDataDraft.value, userImage.value)
  closeDialog()
}

const onFormReset = () => {
  userDataDraft.value = new User(props.userData.id, props.userData)
  closeDialog()
}
</script>

<template>
  <v-dialog v-model="dialog" :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card class="pa-sm-9 pa-5">
      <v-card-item class="text-center">
        <v-card-title class="text-h5"> ユーザー情報 </v-card-title>
      </v-card-item>

      <v-card-text>
        <v-form class="mt-6" @submit.prevent="onFormSubmit">
          <v-row>
            <v-col cols="12" md="12">
              <v-file-input accept="image/*" label="アイコン" @update:model-value="readImageFiles" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="userDataDraft.user_name" label="ユーザー名" />
            </v-col>
            <v-col cols="12" md="12">
              <SnsTextField v-model="userDataDraft.user_sns_twitter" label="X（旧Twitter）" prefix="https://x.com/" />
            </v-col>
            <v-col cols="12" md="12">
              <SnsTextField
                v-model="userDataDraft.user_sns_facebook"
                label="Facebook"
                prefix="https://www.facebook.com/"
              />
            </v-col>
            <v-col cols="12" md="12">
              <SnsTextField
                v-model="userDataDraft.user_sns_instagram"
                label="Instagram"
                prefix="https://www.instagram.com/"
              />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="userDataDraft.user_description" label="自己紹介文" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center gap-4">
              <v-btn type="submit" rounded="pill"> 設定 </v-btn>
              <v-btn rounded="pill" color="secondary" variant="tonal" @click="onFormReset"> キャンセル </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
