<script setup lang="ts">
import StoredUser from '@/schemes/storedUser'
import { storage } from '@/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

interface Props {
  modelValue: boolean
  userData: StoredUser
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: StoredUser): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const userDataDraft = ref<StoredUser>(structuredClone(toRaw(props.userData)))
const userImage = ref<File | null>(null)
const userStorageRef = storageRef(storage, 'users')

watch(props, () => {
  userDataDraft.value = structuredClone(toRaw(props.userData))
})

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const readImageFiles = (files: File[]) => {
  if (files.length === 0) return
  userImage.value = files[0]
}

const closeDialog = () => {
  dialog.value = false
}

const onFormSubmit = async () => {
  if (userImage.value) {
    const filepath = `${userDataDraft.value.userId}/${userImage.value.name}`
    const imageStorageRef = storageRef(userStorageRef, filepath)

    try {
      const snapshot = await uploadBytes(imageStorageRef, userImage.value)
      const url = await getDownloadURL(snapshot.ref)
      userDataDraft.value.userImageUrl = url
    } catch (error) {
      console.error(error)
    }
  }

  emit('submit', userDataDraft.value)
  closeDialog()
}

const onFormReset = () => {
  userDataDraft.value = structuredClone(toRaw(props.userData))
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
              <v-text-field v-model="userDataDraft.userName" label="ユーザー名" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="userDataDraft.userSnsTwitter" label="Twitter" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="userDataDraft.userSnsFacebook" label="Facebook" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="userDataDraft.userSnsInstagram" label="Instagram" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="userDataDraft.userDescription" label="自己紹介文" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center gap-4">
              <v-btn type="submit" rounded> 設定 </v-btn>
              <v-btn rounded color="secondary" variant="tonal" @click="onFormReset"> キャンセル </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
