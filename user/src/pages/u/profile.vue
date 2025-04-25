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
  unlink,
  type User,
  updateEmail,
  signInWithCustomToken
} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import {useValidators} from "@/composable/validators";
import type { VForm } from 'vuetify/components';
import { db, functions } from "@/firebase";
import {doc, updateDoc, getDoc, getDocs, query, collection, where} from 'firebase/firestore'
import {
  convertDocumentDataToStoredUser,
} from '@/schemes/converter'
import { httpsCallable } from 'firebase/functions'
import {convertFirebaseUserToStoredUser} from "@/schemes/converter";
import {linkByProviderService} from "@/utils/providerService";
import { mdiUpload } from '@mdi/js'

const auth = getAuth()
const currentUser = auth.currentUser;

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
if (currentUser) {
  updateProviderData(currentUser);
  email.value = currentUser.email as string;
}

const user = computed(() => {
  const userId = storedUser.value?.userId
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

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

// バリデーション関連 ここから
const validateImage = () => {
  if (!user.value?.user_image_url && !userImage.value) {
    imageError.value = $t('profile.choice_profile_image')
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
    const personalInformationSnapshot = await getDocs(query(
        collection(db, 'users_personal_information'),
        where('user_email', '==', email)
    ))

    storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser, personalInformationSnapshot.docs[0].data().user_email))

    const userStore = useUserStore(firestoredUser.user_id) as UserStore
    await userStore.updateUser(firestoredUser)
    if (image != null) {
      try {
        await userStore.uploadUserImage(image)
      } catch (err) {
        console.error(err)
        window.alert($t('profile.fail_image_upload'))
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
    let isError = false

    const userEmail = email.value
    const userRef = doc(db, 'users', user.value?.user_id as string)

    await updateEmail(currentUser as User, userEmail).then(async () => {
      await updateDoc(userRef, {
        user_email: userEmail,
        verified_at: null,
      })
    }).catch(async (error) => {
      console.error(error)
      if (error.code === 'auth/requires-recent-login') {
        const getCustomToken = httpsCallable(functions, "get_custom_token")
        const result = await getCustomToken({ user_email: currentUser?.email })
        const customToken = result.data as string

        await signInWithCustomToken(auth, customToken).then(async (userCredential) => {
          await updateEmail(userCredential.user as User, userEmail).then(async () => {
            await updateDoc(userRef, {
              user_email: userEmail,
              verified_at: null,
            })
          }).catch((error) => {
            // 基本的にこのスコープのエラーが出る想定は無い
            console.error(error)
            isError = true
          })
        })
      } else if (error.code === 'auth/email-already-in-use') {
        isError = true
        return Object.assign(notification, { message: $t('user.exists_email'), color: 'error' })
      }
    })

    if (isError) return

    const storedUser = convertFirebaseUserToStoredUser(currentUser as User)

    const userSnapShot = await getDoc(doc(db, 'users', storedUser.userId))
    const personalInformationSnapshot = await getDoc(doc(db, 'users_personal_information', storedUser.userId))

    // Pinia のデータを更新
    const currentStoredUser = convertDocumentDataToStoredUser(userSnapShot.data()!, personalInformationSnapshot.data()!)
    storedUserStore.update(currentStoredUser)

    return Object.assign(notification, { message: $t('user.update_email'), color: 'success' })
  } catch (error) {
    console.warn("Error email submit:", error);
  } finally {
    isLoading.value = false
  }
}

const handleFacebookLink = async () => {
  try {
    await linkByProviderService(currentUser as User, 'Facebook')
    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload();
      updateProviderData(auth.currentUser);
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', {snsName: 'Facebook'}), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  }
}

const handleGoogleLoginLink = async () => {
  try {
    await linkByProviderService(currentUser as User, 'Google')
    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload();
      updateProviderData(auth.currentUser);
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', {snsName: 'Google'}), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  }
}

const handleTwitterLoginLink = async () => {
  try {
    await linkByProviderService(currentUser as User, 'Twitter')
    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload();
      updateProviderData(auth.currentUser);
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', {snsName: 'X'}), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  }
}

const handleUnLink = async (providerId: 'google.com' | 'facebook.com' | 'twitter.com') => {
  try {
    isLoading.value = true

    if (auth.currentUser) {
      await unlink(auth.currentUser, providerId)
      // ユーザー情報を再取得して更新
      await auth.currentUser.reload();
      updateProviderData(auth.currentUser);
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }

}
</script>

<template>
  <v-container v-if="user != null" class="px-1">
    <v-row justify="center" class="mt-1 mt-md-16 px-1">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
        <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.profile_settings') }}</div>

          <v-sheet class="d-flex justify-center mt-4 mb-12">
            <div style="position: relative;">
              <UserAvatar :user="user" :size="140" @click="triggerFileInput"/>
              <v-btn :icon="mdiUpload" size="small" variant="flat" class="edit-text" @click="triggerFileInput"></v-btn>
            </div>
          </v-sheet>
          <p v-if="imageError !== ''" class="text-center text-error font-weight-bold">{{imageError}}</p>

          <v-form ref="form" v-model="isValid" @submit.prevent="profileSubmit">
            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" ref="fileInput" @update:model-value="readImageFiles" />

            <v-sheet class="d-flex flex-column ga-7 mb-16" >
              <v-text-field
                  :label="$t('profile.user_account')"
                  v-model="user.user_account"
                  prefix="https://shokuiji.jp/u/"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[noReservedCharsValidator]"
              />

              <v-text-field
                  :label="$t('profile.user_name')"
                  v-model="user.user_name"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[requiredValidator]"
              />
            </v-sheet>

            <v-sheet class="d-flex flex-column ga-7">
              <v-text-field
                  :label="$t('profile.user_sns_twitter')"
                  v-model="user.user_sns_twitter"
                  prefix="https://x.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  :label="$t('profile.user_sns_facebook')"
                  v-model="user.user_sns_facebook"
                  prefix="https://facebook.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  :label="$t('profile.user_sns_instagram')"
                  v-model="user.user_sns_instagram"
                  prefix="https://instagram.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isLoading"
              />

              <v-text-field
                  :label="$t('profile.user_sns_website')"
                  v-model="user.user_sns_website"
                  variant="outlined"
                  :disabled="isLoading"
              />

              <v-textarea
                  :label="$t('profile.user_description')"
                  v-model="user.user_description"
                  rows="5"
                  variant="outlined"
                  :disabled="isLoading"
                  :rules="[requiredValidator]"
              />

              <v-row justify="center">
                <v-btn class="rounded-xl" color="primary" :loading="isLoading" type="submit">{{ $t('profile.change_settings') }}</v-btn>
              </v-row>
            </v-sheet>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.email') }}</div>

          <v-form v-model="isValid" @submit.prevent="emailSubmit">
            <v-text-field
                class=" my-12"
                :label="$t('profile.change_settings')"
                v-model="email"
                variant="outlined"
                :disabled="isLoading"
                :rules="[requiredValidator, emailValidator]"
            />
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isLoading" type="submit">{{ $t('profile.change_settings') }}</v-btn>
            </v-row>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.account_linkage') }}</div>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="GoogleIcon" size="x-large" class="me-3"/>{{ $t('profile.google') }}
            </label>
            <v-btn v-if="!linkedProviderData.includes('google.com')" variant="outlined" color="grey-500" width="100" @click="handleGoogleLoginLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isLoading" @click="() => handleUnLink('google.com')">{{ $t('profile.linked') }}</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="FacebookIcon" size="x-large" class="me-3"/>{{ $t('profile.facebook') }}
            </label>
            <v-btn v-if="!linkedProviderData.includes('facebook.com')" variant="outlined" color="grey-500" width="100" @click="handleFacebookLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isLoading" @click="() => handleUnLink('facebook.com')">{{ $t('profile.linked') }}</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <label class="align-center">
              <v-icon :icon="XIcon" size="x-large" class="me-3"/>{{ $t('profile.twitter') }}
            </label>
            <v-btn v-if="!linkedProviderData.includes('twitter.com')" variant="outlined" color="grey-500" width="100" @click="handleTwitterLoginLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isLoading" @click="() => handleUnLink('twitter.com')">{{ $t('profile.linked') }}</v-btn>
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
  right: 0;
  text-decoration: underline;
  cursor: pointer;
}

.cursor-none {
  cursor: none;
}
</style>