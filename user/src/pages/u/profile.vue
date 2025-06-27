<script setup lang="ts">
import XIcon from '@/icons/x'
import FacebookIcon from '@/icons/facebook.vue'
import GoogleIcon from '@/icons/google.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import {convertFirestoredUserToStoredUser, convertStoredUserToFirestoredUser} from "@/schemes/converter";
import {FirestoredUser, type FirestoredUserPersonalInformation, type StoredUser} from "@/schemes/storedUser"
import UserAvatar from '@/components/UserAvatar.vue'
import {buildThumbnailsLinks} from '@/composable/buildThumbnailsLinks'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  unlink,
  type User,
  type AdditionalUserInfo,
  getAdditionalUserInfo,
} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import {useValidators} from "@/composable/validators";
import type { VForm } from 'vuetify/components';
import { db, functions } from "@/firebase";
import {doc, updateDoc, getDoc, getDocs, query, collection, where, Timestamp} from 'firebase/firestore'
import {
  convertDocumentDataToStoredUser,
} from '@/schemes/converter'
import { httpsCallable } from 'firebase/functions'
import {linkByProviderService} from "@/utils/providerService";
import { mdiUpload } from '@mdi/js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import {useStoreUserAdditionalInfo} from "@/stores/userAdditionalInfo";
import {useStoreFirebaseAuthError} from "@/stores/firebaseAuthError";
import {generatePassCode} from "@/utils/generatePassCode";

type CustomData = {
  email: string
  _tokenResponse?: {
    providerId?: string;
  };
}

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

const userEmailPending = computed(() => {
  return storedUser.value?.userEmailPending === null ? "" : (storedUser.value?.userEmailPending)
})

const router = useRouter()
const route = useRoute()

const isProfileLoading = ref(false)
const isEmailLoading = ref(false)
const isSnsLoading = ref(false)

const isValidProfile = ref(false)
const isValidEmail = ref(false)

const isOpenUnLinkDialog = ref(false)
const isOpenTwitterLinkDialog = ref(false)
const targetUnLinkProvider = ref('')

const form = ref<VForm | null>(null);
const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

const { requiredValidator, noReservedCharsValidator, emailValidator, urlValidator } = useValidators()

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
  if (!isValidProfile.value || !validateImage()) {
    validateImage()
    form.value?.validate()
    return
  }

  try {
    isProfileLoading.value = true

    const firestoredUser = user.value as FirestoredUser
    const image = userImage.value
    const personalInformationSnapshot = await getDocs(query(
        collection(db, 'users_personal_information'),
        where('user_email', '==', email.value)
    ))

    if (!personalInformationSnapshot.docs[0]) return console.error('upi doesn\'t exist')

    storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser, personalInformationSnapshot.docs[0].data() as FirestoredUserPersonalInformation))

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

    Object.assign(notification, { message: $t('profile.update_profile'), color: 'success' })

    if (route.query.redirect) {
      router.push(route.query.redirect as string)
    }
  } catch (error) {
    console.warn("Error profile submit:", error);
  } finally {
    isProfileLoading.value = false
  }
}

const emailSubmit = async () => {
  try {
    isEmailLoading.value = true

    const userEmail = email.value
    const userRef = doc(db, 'users', user.value?.user_id as string)
    const personalInformationSnapshotRef = doc(db, 'users_personal_information', user.value?.user_id as string)

    if (storedUser.value?.userEmail === userEmail) {
      isEmailLoading.value = false
      return Object.assign(notification, { message: $t('profile.not_changed_email'), color: 'warning' })
    }

    // メールアドレスが既に存在しているかチェック、存在していればreturnする。
    const existPersonalInformation = await getDocs(query(
        collection(db, 'users_personal_information'),
        where('user_email', '==', userEmail)
    ))

    if (!existPersonalInformation.empty) {
      return Object.assign(notification, { message: $t('profile.existEmail'), color: 'warning' })
    }

    await updateDoc(userRef, {
      verified_at: null,
    })

    const userSnapShot = await getDoc(doc(db, 'users', storedUser.value?.userId as string))
    const personalInformationSnapshot = await getDoc(doc(db, 'users_personal_information', storedUser.value?.userId as string))

    // Pinia のデータを更新
    const currentStoredUser = convertDocumentDataToStoredUser(userSnapShot.data()!, personalInformationSnapshot.data()!)
    storedUserStore.update(currentStoredUser)

    await updateDoc(personalInformationSnapshotRef, { user_email_pending: userEmail })

    const passCode = generatePassCode()
    const createOrUpdateUser = httpsCallable(functions, "create_or_update_user")
    await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: userEmail, user_pass_code: passCode })
    return router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        redirect: route.path,
      }
    })
  } catch (error) {
    console.warn("Error email submit:", error);
  } finally {
    isEmailLoading.value = false
  }
}

const certificationPendingEmail = async () => {
  const personalInformationSnapshot = await getDoc(doc(db, 'users_personal_information', user.value?.user_id as string))
  const personalInformation = personalInformationSnapshot.data() as FirestoredUserPersonalInformation
  const userEmail = personalInformation.user_email_pending

  // パスコード再発行
  const reGeneratePassCode = generatePassCode()
  const createOrUpdateUser = httpsCallable(functions, "create_or_update_user")
  await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: reGeneratePassCode })

  const sendPassCode = httpsCallable(functions, "send_pass_code")
  await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  return router.push({
    path: '/pass-code',
    query: {
      email: userEmail,
      redirect: route.path,
    }
  })
}

const cancelPendingEmail = async () => {
  const userRef = doc(db, 'users', user.value?.user_id as string)
  await updateDoc(userRef, {
    user_pass_code: null,
    verified_at: Timestamp.now(),
  })
  const personalInformationSnapshotRef = doc(db, 'users_personal_information', user.value?.user_id as string)
  await updateDoc(personalInformationSnapshotRef, { user_email_pending: null })

  const userSnapshot = await getDoc(userRef)
  const userData = userSnapshot.data()
  const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)
  const personalInformation = personalInformationSnapshot.data()

  const storedUser = convertDocumentDataToStoredUser(userData!, personalInformation!)
  storedUserStore.update(storedUser)
  return Object.assign(notification, { message: $t('user.canceled'), color: 'success' })
}

const handleFacebookLink = async () => {
  try {
    isSnsLoading.value = true
    const userCredential = await linkByProviderService(currentUser as User, 'Facebook')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(additionalUserInfo)
    }

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
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = false
  }
}

const handleGoogleLoginLink = async () => {
  try {
    isSnsLoading.value = true
    const userCredential = await linkByProviderService(currentUser as User, 'Google')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(additionalUserInfo)
    }

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
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = false
  }
}

const handleTwitterLoginLink = async () => {
  try {
    isSnsLoading.value = true
    const userCredential = await linkByProviderService(currentUser as User, 'Twitter')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(additionalUserInfo)
    }

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
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = false
  }
}

const handleUnLink = async (providerId: 'google.com' | 'facebook.com' | 'twitter.com') => {
  isOpenUnLinkDialog.value = true
  targetUnLinkProvider.value = providerId as 'google.com' | 'facebook.com' | 'twitter.com'
}

const confirmUnLink = async (providerId: string) => {
  if (!providerId) return
  try {
    isSnsLoading.value = true

    if (auth.currentUser) {
      await unlink(auth.currentUser, providerId)

      const firestoredUser = user.value as FirestoredUser
      const personalInformationSnapshot = await getDocs(query(
          collection(db, 'users_personal_information'),
          where('user_email', '==', email.value)
      ))

      // 各プロバイダーは連携解除時に関連する値を削除する
      switch (providerId) {
        case 'google.com':
          firestoredUser.user_sns_google = null
          break
        case 'facebook.com':
          firestoredUser.user_sns_facebook_name = null
          break
        case 'twitter.com':
          firestoredUser.user_sns_twitter = null
          break
      }

      if (!personalInformationSnapshot.docs[0]) return console.error('upi doesn\'t exist')

      storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser, personalInformationSnapshot.docs[0].data() as FirestoredUserPersonalInformation))

      const userStore = useUserStore(firestoredUser.user_id) as UserStore
      await userStore.updateUser(firestoredUser)

      // ユーザー情報を再取得して更新
      await auth.currentUser.reload();
      updateProviderData(auth.currentUser);
    }
  } catch (error) {
    console.error(error)
  } finally {
    isSnsLoading.value = false
  }
}

onMounted(async () => {
  const additionalUserInfo = useStoreUserAdditionalInfo().additionalUserInfo
  const error = useStoreFirebaseAuthError().error
  if (error instanceof FirebaseError) {
    let credential
    let snsName
    const customData = error?.customData as CustomData
    switch (customData._tokenResponse?.providerId) {
      case 'google.com':
        credential = GoogleAuthProvider.credentialFromError(error)
        snsName = 'Google'
        break
      case 'facebook.com':
        credential = FacebookAuthProvider.credentialFromError(error)
        snsName = 'Facebook'
        break
      case 'twitter.com':
        credential = TwitterAuthProvider.credentialFromError(error)
        snsName = 'X'
        break
    }

    console.error({ error, credential })

    if (error.code === 'auth/credential-already-in-use') {
      useStoreFirebaseAuthError().reset()
      return Object.assign(notification, { message: $t('user.exists_credential', {snsName: snsName}), color: 'error' })
    }
    if (error.code === 'auth/email-already-in-use') {
      useStoreFirebaseAuthError().reset()
      return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
    }
  } else if (error) {
    console.error({ error })
  }

  if (additionalUserInfo === null) return
  isSnsLoading.value = true
  await setSNSProfile(additionalUserInfo)
  isSnsLoading.value = false

  useStoreUserAdditionalInfo().reset()
})

const setSNSProfile = async (additionalUserInfo: AdditionalUserInfo) => {
  const storedUser = storedUserStore.storedUser as StoredUser
  const userStore = useUserStore(storedUser.userId) as UserStore

  switch (additionalUserInfo.providerId) {
    case 'facebook.com':
      storedUser.userSnsFacebookName = storedUser.userSnsFacebookName || additionalUserInfo.profile?.name as string
      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      break
    case 'twitter.com':
      storedUser.userSnsTwitter = additionalUserInfo?.username as string
      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      break
    case 'google.com':
      storedUser.userSnsGoogle = storedUser.userSnsGoogle || additionalUserInfo?.profile?.email as string
      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      break
    default:
      break
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

          <v-form ref="form" v-model="isValidProfile" @submit.prevent="profileSubmit">
            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" ref="fileInput" @update:model-value="readImageFiles" />

            <v-sheet class="d-flex flex-column ga-7 mb-16" >
              <v-text-field
                  :label="$t('profile.user_name')"
                  v-model="user.user_name"
                  variant="outlined"
                  :disabled="isProfileLoading"
                  :rules="[requiredValidator]"
              />

              <v-text-field
                  :label="$t('profile.user_account')"
                  v-model="user.user_account"
                  prefix="shokujii.jp/u/"
                  variant="outlined"
                  :disabled="isProfileLoading"
                  :rules="[noReservedCharsValidator]"
              />

              <v-textarea
                  :label="$t('profile.user_description')"
                  v-model="user.user_description"
                  rows="5"
                  variant="outlined"
                  :disabled="isProfileLoading"
                  :rules="[requiredValidator]"
              />
            </v-sheet>

            <div class="text-center text-h3 font-weight-bold pt-16 mt-16 mb-16">{{ $t('profile.social_link') }}</div>

            <v-sheet class="d-flex flex-column ga-7">
              <v-text-field
                  :label="$t('profile.user_sns_twitter')"
                  v-model="user.user_sns_twitter"
                  prefix="x.com/"
                  variant="outlined"
                  hide-details
                  :disabled="!!user.user_sns_twitter"
                  readonly
                  @click="() => isOpenTwitterLinkDialog = true"
              />

              <v-text-field
                  :label="$t('profile.user_sns_facebook')"
                  v-model="user.user_sns_facebook"
                  prefix="facebook.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isProfileLoading"
              />

              <v-text-field
                  :label="$t('profile.user_sns_instagram')"
                  v-model="user.user_sns_instagram"
                  prefix="instagram.com/"
                  variant="outlined"
                  hide-details
                  :disabled="isProfileLoading"
              />

              <v-text-field
                  :label="$t('profile.user_sns_website')"
                  v-model="user.user_sns_website"
                  variant="outlined"
                  :disabled="isProfileLoading"
                  :rules="[urlValidator]"
              />

              <v-row justify="center">
                <v-btn class="rounded-xl" color="primary" :loading="isProfileLoading" type="submit">{{ $t('profile.change_settings') }}</v-btn>
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
          <v-card-text v-if="userEmailPending">
            <div>
              <span v-html="$t('profile.pending_email', {pending_email: userEmailPending})"/>
              <br>
              <span style="color: red">{{ $t('profile.notice_pending_email') }}</span>
            </div>
            <div class="d-flex flex-row justify-center">
              <v-btn class="ma-2" @click="certificationPendingEmail">{{ $t('profile.certification') }}</v-btn>
              <v-btn class="ma-2" @click="cancelPendingEmail">{{ $t('profile.cancel') }}</v-btn>
            </div>
          </v-card-text>

          <div v-else>
            <v-form v-model="isValidEmail" @submit.prevent="emailSubmit">
              <v-text-field
                  class=" my-12"
                  :label="$t('profile.change_settings')"
                  v-model="email"
                  variant="outlined"
                  :disabled="isEmailLoading"
                  :rules="[requiredValidator, emailValidator]"
              />
              <v-row justify="center">
                <v-btn class="rounded-xl" color="primary" :disabled="!isValidEmail" :loading="isEmailLoading" type="submit">{{ $t('profile.change_settings') }}</v-btn>
              </v-row>
            </v-form>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.account_linkage') }}</div>

          <div class="d-flex justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="GoogleIcon" size="x-large" class="me-3"/>{{ $t('profile.google') }}
              </label>
              <label v-if="user.user_sns_google" class="ml-11 font-weight-bold">{{ user.user_sns_google }}</label>
            </div>

            <v-btn v-if="!linkedProviderData.includes('google.com')" variant="outlined" color="grey-500" width="100" @click="handleGoogleLoginLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isSnsLoading" @click="() => handleUnLink('google.com')">{{ $t('profile.linked') }}</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="FacebookIcon" size="x-large" class="me-3"/>{{ $t('profile.facebook') }}
              </label>
              <label v-if="user.user_sns_facebook_name" class="ml-11 font-weight-bold">{{ user.user_sns_facebook_name }}</label>
            </div>

            <v-btn v-if="!linkedProviderData.includes('facebook.com')" variant="outlined" color="grey-500" width="100" @click="handleFacebookLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isSnsLoading" @click="() => handleUnLink('facebook.com')">{{ $t('profile.linked') }}</v-btn>
          </div>

          <hr>

          <div class="d-flex justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="XIcon" size="x-large" class="me-3"/>{{ $t('profile.twitter') }}
              </label>
              <label v-if="user.user_sns_twitter" class="ml-11 font-weight-bold">{{ user.user_sns_twitter }}</label>
            </div>

            <v-btn v-if="!linkedProviderData.includes('twitter.com')" variant="outlined" color="grey-500" width="100" @click="handleTwitterLoginLink">{{ $t('profile.linkage') }}</v-btn>
            <v-btn v-else color="grey-900" width="100" :loading="isSnsLoading" @click="() => handleUnLink('twitter.com')">{{ $t('profile.linked') }}</v-btn>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog v-model="isOpenTwitterLinkDialog" :is-confirm="true" :ok-text="$t('profile.linkage')" :ok-click="handleTwitterLoginLink">
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('profile.twitter_link_modal_title') }}
      </v-card-text>
    </confirm-dialog>
    <confirm-dialog v-model="isOpenUnLinkDialog" :is-confirm="true" :ok-text="$t('profile.unlink')" :ok-click="() => confirmUnLink(targetUnLinkProvider)">
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('profile.unlink_modal_title') }}
      </v-card-text>
    </confirm-dialog>
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