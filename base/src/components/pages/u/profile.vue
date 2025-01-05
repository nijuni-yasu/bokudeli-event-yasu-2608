<script setup lang="ts">
import XIcon from '@/icons/x'
import FacebookIcon from '@/icons/facebook.vue'
import GoogleIcon from '@/icons/google.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import {convertFirestoredUserToStoredUser} from "@/schemes/converter";
import {FirestoredUser} from "@/schemes/storedUser"
import UserAvatar from '@/components/UserAvatar.vue'
import {buildThumbnailsLinks} from '@/composable/buildThumbnailsLinks'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  type User
} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import {useValidators} from "@/composable/validators";
import type { VForm } from 'vuetify';
import {db} from "@/firebase";
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import {
  convertDocumentDataToStoredUser,
} from '@/schemes/converter'

const auth = getAuth();

const storedUserStore = useStoreStoredUser()
const { storedUser } = storeToRefs(storedUserStore)
const email = ref<string>("")
const linkedProviderData = ref<string[]>([]);

const updateProviderData = (user: User | null) => {
  linkedProviderData.value = user
      ? user.providerData.map((info) => info.providerId)
      : [];
};

// 初期化（現在のユーザー情報を取得）
if (auth.currentUser) {
  updateProviderData(auth.currentUser);
}

const user = computed(() => {
  const userId = storedUser.value?.userId
  email.value = storedUser.value?.userEmail as string
  return userId == null ? null : (useUserStore(userId) as UserStore).user
})

const router = useRouter()
const route = useRoute()

const isLoading = ref(false)

const isValid = ref(false)

const form = ref<VForm | null>(null);
const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

const { requiredValidator, noReservedCharsValidator, emailValidator } = useValidators()

const imageError = ref("")

// バリデーション関連 ここから
const validateImage = () => {
  if (!user.value?.user_image_url && !userImage.value) {
    imageError.value = "プロフィール画像を選択してください。"
    return false
  } else {
    imageError.value = ""
    return true
  }
}

watch(userImage, validateImage)
// バリデーション関連 ここまで


// 画像ファイル選択処理
const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const readImageFiles = (files: File | File[]) => {
  if (files instanceof File) files = [files]
  if (files.length === 0) return
  const file = files[0]
  userImage.value = file

  const firestoredUser = user.value as FirestoredUser
  firestoredUser.user_thumb_image_urls = buildThumbnailsLinks(firestoredUser.user_id, new URL(URL.createObjectURL(file)))
}


const profileSubmit = async () => {
  if (!isValid.value || !validateImage()) {
    validateImage()
    form.value?.validate()
    return
  }

  try {
    isLoading.value = true

    const firestoredUser = user.value as FirestoredUser
    const image = userImage.value

    storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser))

    const userStore = useUserStore(firestoredUser.user_id) as UserStore
    await userStore.updateUser(firestoredUser)
    if (image != null) {
      try {
        await userStore.uploadUserImage(image)
      } catch (err) {
        console.error(err)
        window.alert('画像のアップロードに失敗しました')
      }
    }

    if (route.query.redirect) {
      router.push(route.query.redirect as string)
    } else {
      router.push('/')
    }
  } catch (error) {
    console.warn("Error profile submit:", error);
  } finally {
    isLoading.value = false
  }
}

const emailSubmit = async () => {
  try {
    isLoading.value = true

    const userRef = doc(db, 'users', user.value?.user_id as string)
    await updateDoc(userRef, {
      user_email: email.value,
    })

    const userSnap = await getDoc(userRef)

    // Pinia のデータを更新
    const currentStoredUser = convertDocumentDataToStoredUser(userSnap.data())

    storedUserStore.update(currentStoredUser)
  } catch (error) {
    console.warn("Error email submit:", error);
  } finally {
    isLoading.value = false
  }
}

const linkByProviderService = async (providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  const user = getAuth().currentUser
  if (!user) return

  if (import.meta.env.DEV) {
    await linkWithPopup(user, provider);
  } else {
    await linkWithRedirect(user, provider)
  }

  // ユーザー情報を再取得して更新
  if (auth.currentUser) {
    await auth.currentUser.reload();
    updateProviderData(auth.currentUser);
  }
}

const handleFacebookLink = async () => {
  try {
    await linkByProviderService('Facebook')
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
    } else {
      console.error({ error })
    }
  }
}

const handleGoogleLoginLink = async () => {
  try {
    await linkByProviderService('Google')
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })
    } else {
      console.error({ error })
    }
  }
}

const handleTwitterLoginLink = async () => {
  try {
    await linkByProviderService('Twitter')
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })
    } else {
      console.error({ error })
    }
  }
}
</script>

<template>
  <v-container v-if="user != null">
    <v-row justify="center" class="mt-16">
      <v-col md="6" class="">
        <v-sheet class="rounded-lg py-14 px-16">
          <h1 class="text-center">プロフィール設定</h1>

          <v-sheet class="d-flex justify-center align-center mt-4 mb-12" style="position: relative;">
            <UserAvatar :user="user" :size="140" @click="triggerFileInput"/>
            <span class="edit-text text-primary" @click="triggerFileInput">編集</span>
          </v-sheet>
          <p v-if="imageError !== ''" class="text-center text-error font-weight-bold">{{imageError}}</p>

          <v-form ref="form" v-model="isValid" @submit.prevent="profileSubmit">
            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" label="プロフィール画像" ref="fileInput" @update:model-value="readImageFiles" />

            <v-sheet class="d-flex flex-column ga-7 mb-16" >
              <v-text-field
                  label="ユーザーURL"
                  v-model="user.user_url_path"
                  prefix="https://shokuiji.jp/u/"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[noReservedCharsValidator]"
              />

              <v-text-field
                  label="ユーザー名"
                  v-model="user.user_name"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[requiredValidator]"
              />
            </v-sheet>

            <v-sheet class="d-flex flex-column ga-7">
              <v-text-field
                  label="X (Twitter)"
                  v-model="user.user_sns_twitter"
                  prefix="https://x.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  label="Facebook"
                  v-model="user.user_sns_facebook"
                  prefix="https://facebook.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  label="Instagram"
                  v-model="user.user_sns_instagram"
                  prefix="https://instagram.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  label="WEBサイト"
                  v-model="user.user_sns_website"
                  variant="outlined"
                  :disabled="isLoading"
              />

              <v-textarea
                  label="自己紹介文"
                  v-model="user.user_description"
                  rows="4"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[requiredValidator]"
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
        <v-sheet class="rounded-lg py-14 px-16">
          <h1 class="text-center">メールアドレス</h1>

          <v-form v-model="isValid" @submit.prevent="emailSubmit">
            <v-text-field
                class=" my-12"
                label="メールアドレス"
                v-model="email"
                variant="outlined"
                :disabled="isLoading"
                :rules="[requiredValidator, emailValidator]"
            />
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isLoading" type="submit">変更する</v-btn>
            </v-row>
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
            <v-btn v-if="!linkedProviderData.includes('google.com')" variant="outlined" color="grey-500" width="100" @click="handleGoogleLoginLink">連携する</v-btn>
            <v-btn v-else color="grey-900" width="100" class="cursor-none">連携中</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="FacebookIcon" size="x-large" class="me-3"/>Facebook
            </label>
            <v-btn v-if="!linkedProviderData.includes('facebook.com')" variant="outlined" color="grey-500" width="100" @click="handleFacebookLink">連携する</v-btn>
            <v-btn v-else color="grey-900" width="100" class="cursor-none">連携中</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="XIcon" size="x-large" class="me-3"/>Twitter
            </label>
            <v-btn v-if="!linkedProviderData.includes('twitter.com')" variant="outlined" color="grey-500" width="100" @click="handleTwitterLoginLink">連携する</v-btn>
            <v-btn v-else color="grey-900" width="100" class="cursor-none">連携中</v-btn>
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

.cursor-none {
  cursor: none;
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