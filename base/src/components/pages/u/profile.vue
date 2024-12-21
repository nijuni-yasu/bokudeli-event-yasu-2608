<script setup lang="ts">
import { functions } from '@/firebase'
import {connectFunctionsEmulator, httpsCallable} from 'firebase/functions'
import logo from "@/assets/images/shokujii/shokujii_logo_wide.png";
import {generatePassCode} from "@/utils/generatePassCode";
import XIcon from '@/icons/x'
import AppleIcon from '@/icons/apple.vue'
import FacebookIcon from '@/icons/facebook.vue'
import GoogleIcon from '@/icons/google.vue'


// TODO: 開発用。後ほど削除すること
connectFunctionsEmulator(functions, 'localhost', 5001);

const router = useRouter()
const route = useRoute()

const isLoading = ref(false)

const isValid = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)
const imageUrl = ref<string | null>(null)

const userUrl = ref("");
const userName = ref("");
const twitterUrl = ref("");
const facebookUrl = ref("");
const instagramUrl = ref("");
const websiteUrl = ref("");
const bio = ref("");

const email = ref("")

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

// 画像ファイル選択処理
const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const readImageFiles = (files: File | File[]) => {
  if (files instanceof File) files = [files]
  if (files.length === 0) return
  const file = files[0]
  userImage.value = file
  imageUrl.value = URL.createObjectURL(file)
}


const profileSubmit = () => {
  // TODO: UserBioPanel.vue, UserBioEditDialog.vueを参考にuserStore.uploadUserImageを使用してアップロード
  try {
    isLoading.value = true
    isValid.value = true

  } catch (error) {
    console.warn("Error profile submit:", error);
  } finally {
    isLoading.value = false
    isValid.value = false
  }
}

const emailSubmit = () => {
  try {
    isLoading.value = true
    isValid.value = true

    const userEmail = email.value
    // TODO: user idからemailを保存する処理
  } catch (error) {
    console.warn("Error email submit:", error);
  } finally {
    isLoading.value = false
    isValid.value = false
  }
}

</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col md="6" class="">
        <v-sheet class="rounded-lg py-14 px-16">
          <h1 class="text-center">プロフィール設定</h1>

          <v-sheet class="d-flex justify-center align-center mt-4 mb-12" style="position: relative;">
            <v-avatar
                size="140"
                color="grey-500"
                @click="triggerFileInput"
                style="cursor: pointer"
            >
              <img
                  v-if="imageUrl"
                  :src="imageUrl"
                  alt="プロフィール画像"
                  class="avatar-img"
              />
            </v-avatar>
            <span class="edit-text text-primary" @click="triggerFileInput">編集</span>

            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" label="プロフィール画像" ref="fileInput" @update:model-value="readImageFiles" />
          </v-sheet>

          <v-form v-model="isValid" @submit.prevent="profileSubmit">
            <v-sheet class="d-flex flex-column ga-7 mb-16" >
              <v-text-field
                  v-model="userUrl"
                  label="ユーザーURL"
                  prefix="https://shokuiji.jp/u/"
                  variant="outlined"
                  hide-details
              />

              <v-text-field
                  label="ユーザー名"
                  v-model="userName"
                  variant="outlined"
              />
            </v-sheet>

            <v-sheet class="d-flex flex-column ga-7">
              <v-text-field
                  label="X (Twitter)"
                  v-model="twitterUrl"
                  prefix="https://x.com/"
                  variant="outlined"
                  hide-details
              />

              <v-text-field
                  label="Facebook"
                  v-model="facebookUrl"
                  prefix="https://facebook.com/"
                  variant="outlined"
                  hide-details
              />

              <v-text-field
                  label="Instagram"
                  v-model="instagramUrl"
                  prefix="https://instagram.com/"
                  variant="outlined"
                  hide-details
              />

              <v-text-field
                  label="WEBサイト"
                  v-model="websiteUrl"
                  variant="outlined"
              />

              <v-textarea
                  label="自己紹介文"
                  v-model="bio"
                  rows="4"
                  variant="outlined"
              />

              <v-row justify="center">
                <v-btn class="rounded-xl" color="primary" :loading="isLoading" type="submit">設定を変更する</v-btn>
              </v-row>
            </v-sheet>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col md="6" class="">
        <v-sheet class="rounded-lg py-14 px-16 text-center">
          <h1 class="text-center">メールアドレス</h1>

          <v-form v-model="isValid" @submit.prevent="emailSubmit">
            <v-text-field
                class=" my-12"
                label="メールアドレス"
                v-model="userName"
                variant="outlined"
                :disabled="isValid"
            />
            <v-btn class="rounded-xl" color="primary" :loading="isLoading" type="submit">変更する</v-btn>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col md="6" class="">
        <v-sheet class="rounded-lg py-14 px-16">
          <h1 class="text-center">SNSアカウント連携</h1>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="GoogleIcon" size="x-large" class="me-3"/>Google
            </label>
            <v-btn variant="outlined" color="grey-500">連携する</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="AppleIcon" size="x-large" class="me-4"/>Apple
            </label>
            <v-btn variant="outlined" color="grey-500">連携する</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="FacebookIcon" size="x-large" class="me-3"/>Facebook
            </label>
            <v-btn variant="outlined" color="grey-500">連携する</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="XIcon" size="x-large" class="me-3"/>Twitter
            </label>
            <v-btn variant="outlined" color="grey-500">連携する</v-btn>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-text {
  position: absolute;
  bottom: -5px;
  right: 140px;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 600px) {
  .edit-text {
    right: 40px;
  }
}

@media (max-width: 400px) {
  .edit-text {
    right: 20px;
  }
}
</style>