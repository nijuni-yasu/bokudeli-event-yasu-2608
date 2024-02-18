<script setup lang="ts">
import { FirestoredUser } from '@/schemes/storedUser'
import _ from 'lodash'

interface Props {
  modelValue: boolean
  userData: FirestoredUser
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: FirestoredUser, image?: File): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const userDataDraft = ref<FirestoredUser>(new FirestoredUser(_.cloneDeep(props.userData)))
const userImage = ref<File | undefined>(undefined)

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const trimInputtedId = (id: string | null, urlPattern: RegExp) => {
  if (!id) return ''
  return id.trim().replace(/\/+$/, '').replace(urlPattern, '')
}
const twitterId = computed({
  get: () => userDataDraft.value.user_sns_twitter,
  set: (val) => {
    userDataDraft.value.user_sns_twitter = trimInputtedId(val, /^https:\/\/(mobile.)?twitter\.com\//)
  },
})

const facebookId = computed({
  get: () => userDataDraft.value.user_sns_facebook,
  set: (val) => {
    userDataDraft.value.user_sns_facebook = trimInputtedId(val, /^https:\/\/www\.facebook\.com\//)
  },
})

const instagramId = computed({
  get: () => userDataDraft.value.user_sns_instagram,
  set: (val) => {
    userDataDraft.value.user_sns_instagram = trimInputtedId(val, /^https:\/\/www\.instagram\.com\//)
  },
})

const readImageFiles = (files: File[]) => {
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
  userDataDraft.value = new FirestoredUser(_.cloneDeep(props.userData))
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
              <v-text-field v-model="twitterId" label="Twitter" prefix="https://twitter.com/" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="facebookId" label="Facebook" prefix="https://www.facebook.com/" />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="instagramId" label="Instagram" prefix="https://www.instagram.com/" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="userDataDraft.user_description" label="自己紹介文" />
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
