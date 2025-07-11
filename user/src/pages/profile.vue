<script setup lang="ts">
import XIcon from '@/icons/x'
import FacebookIcon from '@/icons/facebook.vue'
import GoogleIcon from '@/icons/google.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import { convertFirestoredUserToStoredUser, convertStoredUserToFirestoredUser } from '@/schemes/converter'
import { FirestoredUser, type FirestoredUserPersonalInformation, type StoredUser } from '@/schemes/storedUser'
import UserAvatar from '@/components/UserAvatar.vue'
import { buildThumbnailsLinks } from '@/composable/buildThumbnailsLinks'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  unlink,
  type User,
  type AdditionalUserInfo,
  getAdditionalUserInfo,
  type UserCredential,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { useValidators } from '@/composable/validators'
import type { VForm } from 'vuetify/components'
import { db, functions } from '@/firebase'
import { doc, updateDoc, getDoc, getDocs, query, collection, where, Timestamp } from 'firebase/firestore'
import { convertDocumentDataToStoredUser } from '@/schemes/converter'
import { httpsCallable } from 'firebase/functions'
import { linkByProviderService } from '@/utils/providerService'
import { mdiUpload } from '@mdi/js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useStoreUserAdditionalInfo } from '@/stores/userAdditionalInfo'
import { useStoreFirebaseAuthError } from '@/stores/firebaseAuthError'
import { generatePassCode } from '@/utils/generatePassCode'
import { useStoreUserCredential } from '@/stores/userCredential'

type CustomData = {
  email: string
  _tokenResponse?: {
    providerId?: string
  }
}

const auth = getAuth()
const currentUser = auth.currentUser

const storedUserStore = useStoreStoredUser()
const { storedUser } = storeToRefs(storedUserStore)
const email = ref<string>('')
const linkedProviderData = ref<string[]>([])

const updateProviderData = (user: User | null) => {
  linkedProviderData.value = user ? user.providerData.map((info) => info.providerId) : []
}

// 初期化（現在のユーザー情報を取得）
if (currentUser) {
  updateProviderData(currentUser)
  email.value = currentUser.email as string
}

const user = computed(() => {
  return storedUser.value
})
const firestoredUser = ref<FirestoredUser>(convertStoredUserToFirestoredUser(user.value as StoredUser))

const userSnapshotRef = doc(db, 'users', user.value?.userId as string)
const personalInformationSnapshotRef = doc(db, 'users_personal_information', user.value?.userId as string)

const userEmailPending = computed(() => {
  return user.value?.userEmailPending
})

const userStore = useUserStore(user.value?.userId as string) as UserStore

const router = useRouter()
const route = useRoute()

const isProfileLoading = ref<boolean>(false)
const isEmailLoading = ref<boolean>(false)
const isVerificationLoading = ref<boolean>(false)
const isSnsLoading = ref<'google.com' | 'facebook.com' | 'twitter.com' | null>(null)

const isValidProfile = ref<boolean>(false)
const isValidEmail = ref<boolean>(false)

const isOpenUnLinkDialog = ref<boolean>(false)
const isOpenTwitterLinkDialog = ref<boolean>(false)
const targetUnLinkProvider = ref<string>('')

const form = ref<VForm | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

const imageError = ref('')

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

// バリデーション関連 ここから
const { requiredValidator, emailValidator, urlValidator, accountValidator } = useValidators()

const accountFieldRef = ref()
const isCheckingAccount = ref(false)
const isValidSameAccount = ref<true | string>(true)

const validateAccount = async (userAccount: string): Promise<boolean> => {
  const userSnapShot = await getDoc(userSnapshotRef)
  const user = userSnapShot.data() as FirestoredUser
  const duplicatedUserAccount = await getDocs(query(collection(db, 'users'), where('user_account', '==', userAccount)))
  if (userAccount === user.user_account) {
    return true
  }
  return duplicatedUserAccount.empty
}

const checkAccountExists = async (value: string) => {
  isCheckingAccount.value = true
  try {
    isValidSameAccount.value = (await validateAccount(value)) || $t('profile.validator_account_exists')
    await nextTick(() => {
      accountFieldRef.value.validate()
    })
  } finally {
    isCheckingAccount.value = false
  }
}

const validateImage = () => {
  if (!user.value?.userImageUrl && !userImage.value) {
    imageError.value = $t('profile.choice_profile_image')
    return false
  } else {
    imageError.value = ''
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

  firestoredUser.value = convertStoredUserToFirestoredUser(user.value as StoredUser)
  firestoredUser.value.user_thumb_image_urls = buildThumbnailsLinks(
    firestoredUser.value.user_id,
    new URL(URL.createObjectURL(file)),
  )
}

const profileSubmit = async () => {
  if (!isValidProfile.value || !validateImage()) {
    validateImage()
    form.value?.validate()
    return
  }

  try {
    isProfileLoading.value = true

    const image = userImage.value

    await userStore.updateUser(convertStoredUserToFirestoredUser(user.value as StoredUser))
    if (image != undefined) {
      try {
        await userStore.uploadUserImage(image)
        userImage.value = undefined
      } catch (err) {
        console.error(err)
        window.alert($t('profile.fail_image_upload'))
      }
    }

    const userSnapShot = await getDoc(userSnapshotRef)
    const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)

    storedUserStore.update(
      convertFirestoredUserToStoredUser(
        userSnapShot.data() as FirestoredUser,
        personalInformationSnapshot.data() as FirestoredUserPersonalInformation,
      ),
    )

    firestoredUser.value = convertStoredUserToFirestoredUser(user.value as StoredUser)

    Object.assign(notification, { message: $t('profile.update_profile'), color: 'success' })

    if (route.query.redirect) {
      router.push(route.query.redirect as string)
    }
  } catch (error) {
    console.warn('Error profile submit:', error)
  } finally {
    isProfileLoading.value = false
  }
}

const emailSubmit = async () => {
  try {
    isEmailLoading.value = true

    const userEmail = email.value

    if (user.value?.userEmail === userEmail) {
      isEmailLoading.value = false
      return Object.assign(notification, { message: $t('profile.not_changed_email'), color: 'warning' })
    }

    // メールアドレスが既に存在しているかチェック、存在していればreturnする。
    const existPersonalInformation = await getDocs(
      query(collection(db, 'users_personal_information'), where('user_email', '==', userEmail)),
    )

    if (!existPersonalInformation.empty) {
      return Object.assign(notification, { message: $t('profile.exist_email'), color: 'warning' })
    }

    await updateDoc(userSnapshotRef, {
      verified_at: null,
    })

    const userSnapShot = await getDoc(userSnapshotRef)
    const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)

    // Pinia のデータを更新
    const currentStoredUser = convertDocumentDataToStoredUser(
      userSnapShot.data() as FirestoredUser,
      personalInformationSnapshot.data() as FirestoredUserPersonalInformation,
    )
    storedUserStore.update(currentStoredUser)

    await updateDoc(personalInformationSnapshotRef, { user_email_pending: userEmail })

    const passCode = generatePassCode()
    const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
    await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: userEmail, user_pass_code: passCode })
    return router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        redirect: route.path,
      },
    })
  } catch (error) {
    console.warn('Error email submit:', error)
  } finally {
    isEmailLoading.value = false
  }
}

const certificationPendingEmail = async () => {
  isVerificationLoading.value = true
  const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)
  const personalInformation = personalInformationSnapshot.data() as FirestoredUserPersonalInformation
  const userEmail = personalInformation.user_email_pending

  // パスコード再発行
  const reGeneratePassCode = generatePassCode()
  const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
  await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: reGeneratePassCode })

  const sendPassCode = httpsCallable(functions, 'send_pass_code')
  await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  return router.push({
    path: '/pass-code',
    query: {
      email: userEmail,
      redirect: route.path,
    },
  })
}

const cancelPendingEmail = async () => {
  await updateDoc(userSnapshotRef, {
    user_pass_code: null,
    verified_at: Timestamp.now(),
  })
  await updateDoc(personalInformationSnapshotRef, { user_email_pending: null })

  const userSnapshot = await getDoc(userSnapshotRef)
  const userData = userSnapshot.data()
  const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)
  const personalInformation = personalInformationSnapshot.data()

  const storedUser = convertDocumentDataToStoredUser(
    userData as FirestoredUser,
    personalInformation as FirestoredUserPersonalInformation,
  )
  storedUserStore.update(storedUser as StoredUser)
  return Object.assign(notification, { message: $t('user.canceled'), color: 'success' })
}

const handleFacebookLink = async () => {
  try {
    isSnsLoading.value = 'facebook.com'
    const userCredential = await linkByProviderService(currentUser as User, 'Facebook')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload()
      updateProviderData(auth.currentUser)
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, {
          message: $t('user.exists_credential', { snsName: 'Facebook' }),
          color: 'error',
        })
      }
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = null
  }
}

const handleGoogleLoginLink = async () => {
  try {
    isSnsLoading.value = 'google.com'
    const userCredential = await linkByProviderService(currentUser as User, 'Google')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload()
      updateProviderData(auth.currentUser)
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, {
          message: $t('user.exists_credential', { snsName: 'Google' }),
          color: 'error',
        })
      }
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = null
  }
}

const handleTwitterLoginLink = async () => {
  try {
    isSnsLoading.value = 'twitter.com'
    const userCredential = await linkByProviderService(currentUser as User, 'Twitter')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    if (auth.currentUser) {
      await auth.currentUser.reload()
      updateProviderData(auth.currentUser)
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', { snsName: 'X' }), color: 'error' })
      }
      if (error.code === 'auth/email-already-in-use') {
        useStoreFirebaseAuthError().reset()
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isSnsLoading.value = null
  }
}

const handleUnLink = async (providerId: 'google.com' | 'facebook.com' | 'twitter.com') => {
  isOpenUnLinkDialog.value = true
  targetUnLinkProvider.value = providerId as 'google.com' | 'facebook.com' | 'twitter.com'
}

const confirmUnLink = async (providerId: string) => {
  if (!providerId) return
  try {
    isSnsLoading.value = providerId as 'google.com' | 'facebook.com' | 'twitter.com'

    if (auth.currentUser) {
      await unlink(auth.currentUser, providerId)

      const userSnapshot = await getDoc(userSnapshotRef)
      const userData = userSnapshot.data()
      const personalInformationSnapshot = await getDoc(personalInformationSnapshotRef)
      const personalInformation = personalInformationSnapshot.data()

      const storedUser = convertDocumentDataToStoredUser(
        userData as FirestoredUser,
        personalInformation as FirestoredUserPersonalInformation,
      )

      // 各プロバイダーは連携解除時に関連する値を削除する
      switch (providerId) {
        case 'google.com':
          storedUser.userSnsGoogle = null
          await updateDoc(personalInformationSnapshotRef, { user_sns_google: null })
          break
        case 'facebook.com':
          storedUser.userSnsFacebookName = null
          break
        case 'twitter.com':
          storedUser.userSnsTwitter = null
          storedUser.userSnsTwitterAccessToken = null
          storedUser.userSnsTwitterSecret = null
          await updateDoc(personalInformationSnapshotRef, {
            user_sns_twitter_access_token: null,
            user_sns_twitter_secret: null,
          })
          break
      }

      storedUserStore.update(storedUser)

      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))

      // ユーザー情報を再取得して更新
      await auth.currentUser.reload()
      updateProviderData(auth.currentUser)
    }
  } catch (error) {
    console.error(error)
  } finally {
    isSnsLoading.value = null
  }
}

onMounted(async () => {
  const userCredential = useStoreUserCredential().userCredential
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
      return Object.assign(notification, {
        message: $t('user.exists_credential', { snsName: snsName }),
        color: 'error',
      })
    }
    if (error.code === 'auth/email-already-in-use') {
      useStoreFirebaseAuthError().reset()
      return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
    }
  } else if (error) {
    console.error({ error })
  }

  if (!userCredential || additionalUserInfo === null) return
  isSnsLoading.value = additionalUserInfo.providerId as 'google.com' | 'facebook.com' | 'twitter.com'
  await setSNSProfile(userCredential, additionalUserInfo)
  isSnsLoading.value = null

  useStoreUserAdditionalInfo().reset()
})

const setSNSProfile = async (userCredential: UserCredential, additionalUserInfo: AdditionalUserInfo) => {
  const storedUser = storedUserStore.storedUser as StoredUser

  switch (additionalUserInfo.providerId) {
    case 'facebook.com':
      storedUser.userSnsFacebookName = storedUser.userSnsFacebookName || (additionalUserInfo.profile?.name as string)
      break
    case 'twitter.com':
      storedUser.userSnsTwitter = additionalUserInfo?.username as string

      var twitterCredential = TwitterAuthProvider.credentialFromResult(userCredential)
      if (twitterCredential?.accessToken && twitterCredential.secret) {
        storedUser.userSnsTwitterAccessToken = storedUser.userSnsTwitterAccessToken || twitterCredential.accessToken
        storedUser.userSnsTwitterSecret = storedUser.userSnsTwitterSecret || twitterCredential.secret

        if (storedUser.userSnsTwitterAccessToken && storedUser.userSnsTwitterSecret) {
          await updateDoc(personalInformationSnapshotRef, {
            user_sns_twitter_access_token: twitterCredential.accessToken,
            user_sns_twitter_secret: twitterCredential.secret,
          })
        }
      }
      break
    case 'google.com':
      storedUser.userSnsGoogle = additionalUserInfo?.profile?.email as string
      await updateDoc(personalInformationSnapshotRef, { user_sns_google: storedUser.userSnsGoogle })
      break
  }

  await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
  storedUserStore.update(storedUser)
}
</script>

<template>
  <v-container v-if="user != null" class="px-1">
    <v-form ref="form" v-model="isValidProfile" @submit.prevent="profileSubmit">
      <v-row justify="center" class="mt-1 mt-md-16 px-1">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
            <div class="text-center text-h3 font-weight-bold">{{ $t('profile.profile_settings') }}</div>

            <v-sheet class="d-flex justify-center mt-4 mb-12">
              <div style="position: relative">
                <UserAvatar :user="firestoredUser" :size="140" @click="triggerFileInput" />
                <v-btn
                  :icon="mdiUpload"
                  size="small"
                  variant="flat"
                  class="edit-text"
                  @click="triggerFileInput"
                ></v-btn>
              </div>
            </v-sheet>
            <p v-if="imageError !== ''" class="text-center text-error font-weight-bold">{{ imageError }}</p>

            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" ref="fileInput" @update:model-value="readImageFiles" />

            <v-sheet class="d-flex flex-column ga-7 mb-12">
              <v-text-field
                :label="$t('profile.user_name')"
                v-model="user.userName"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
              />

              <v-text-field
                :label="$t('profile.user_account')"
                v-model="user.userAccount"
                prefix="shokujii.jp/u/"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[isValidSameAccount, accountValidator]"
                ref="accountFieldRef"
                @update:modelValue="checkAccountExists"
              />

              <v-textarea
                :label="$t('profile.user_description')"
                v-model="user.userDescription"
                rows="5"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
              />
            </v-sheet>
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isProfileLoading" type="submit">{{
                $t('profile.change_settings')
              }}</v-btn>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row v-if="isNew !== 1" justify="center" class="mt-8">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
            <div class="text-center text-h3 font-weight-bold mb-4">{{ $t('profile.social_link') }}</div>
            <div class="text-subtitle-1 mt-3 mb-10" v-html="$t('profile.social_link_description')" />

            <v-sheet class="d-flex flex-column ga-7 mb-12">
              <v-text-field
                :label="$t('profile.user_sns_twitter')"
                v-model="user.userSnsTwitter"
                prefix="x.com/"
                variant="outlined"
                hide-details
                :disabled="!!user.userSnsTwitter"
                readonly
                @click="() => (isOpenTwitterLinkDialog = true)"
              />

              <v-text-field
                :label="$t('profile.user_sns_facebook')"
                v-model="user.userSnsFacebook"
                prefix="facebook.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_instagram')"
                v-model="user.userSnsInstagram"
                prefix="instagram.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_website')"
                v-model="user.userSnsWebsite"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[urlValidator]"
              />
            </v-sheet>
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isProfileLoading" type="submit">{{
                $t('profile.change_settings')
              }}</v-btn>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
    </v-form>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.email') }}</div>
          <div class="text-subtitle-1 mt-3 mb-10">{{ $t('profile.email_description') }}</div>

          <v-card-text v-if="userEmailPending">
            <div>
              <span v-html="$t('profile.pending_email', { pending_email: userEmailPending })" />
              <br />
              <span style="color: red">{{ $t('profile.notice_pending_email') }}</span>
            </div>
            <div class="d-flex flex-row justify-center">
              <v-btn class="ma-2" :loading="isVerificationLoading" @click="certificationPendingEmail">{{
                $t('profile.certification')
              }}</v-btn>
              <v-btn class="ma-2" :disabled="isVerificationLoading" @click="cancelPendingEmail">{{
                $t('profile.cancel')
              }}</v-btn>
            </div>
          </v-card-text>

          <div v-else>
            <v-form v-model="isValidEmail" @submit.prevent="emailSubmit">
              <v-text-field
                class="my-12"
                :label="$t('profile.change_settings')"
                v-model="email"
                variant="outlined"
                :disabled="isEmailLoading"
                :rules="[requiredValidator, emailValidator]"
              />
              <v-row justify="center">
                <v-btn
                  class="rounded-xl"
                  color="primary"
                  :disabled="!isValidEmail"
                  :loading="isEmailLoading"
                  type="submit"
                  >{{ $t('profile.change_settings') }}</v-btn
                >
              </v-row>
            </v-form>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="isNew !== 1" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.account_linkage') }}</div>
          <div class="text-subtitle-1 mt-3 mb-10">{{ $t('profile.account_linkage_description') }}</div>

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="GoogleIcon" size="x-large" class="me-3" />{{ $t('profile.google') }}
              </label>
              <label v-if="user.userSnsGoogle" class="ml-11 font-weight-bold">{{ user.userSnsGoogle }}</label>
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="!linkedProviderData.includes('google.com')"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'google.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'google.com'"
                @click="handleGoogleLoginLink"
                >{{ $t('profile.linkage') }}</v-btn
              >
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'google.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'google.com'"
                @click="() => handleUnLink('google.com')"
                >{{ $t('profile.linked') }}</v-btn
              >
            </div>
          </div>

          <hr />

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="FacebookIcon" size="x-large" class="me-3" />{{ $t('profile.facebook') }}
              </label>
              <label v-if="user.userSnsFacebookName" class="ml-11 font-weight-bold">{{
                user.userSnsFacebookName
              }}</label>
              <label v-if="user.userSnsFacebookName && !linkedProviderData.includes('facebook.com')" class="ml-11 re-link" v-html="$t('profile.re_link')" />
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="!linkedProviderData.includes('facebook.com')"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'facebook.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'facebook.com'"
                @click="handleFacebookLink"
                >{{ $t('profile.linkage') }}</v-btn
              >
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'facebook.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'facebook.com'"
                @click="() => handleUnLink('facebook.com')"
                >{{ $t('profile.linked') }}</v-btn
              >
            </div>
          </div>

          <hr />

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="XIcon" size="x-large" class="me-3" />{{ $t('profile.twitter') }}
              </label>
              <label v-if="user.userSnsTwitter" class="ml-11 font-weight-bold">{{ user.userSnsTwitter }}</label>
              <label v-if="user.userSnsTwitter && !linkedProviderData.includes('twitter.com')" class="ml-11 re-link" v-html="$t('profile.re_link')" />
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="!linkedProviderData.includes('twitter.com')"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'twitter.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'twitter.com'"
                @click="handleTwitterLoginLink"
                >{{ $t('profile.linkage') }}</v-btn
              >
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'twitter.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'twitter.com'"
                @click="() => handleUnLink('twitter.com')"
                >{{ $t('profile.linked') }}</v-btn
              >
            </div>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog
      v-model="isOpenTwitterLinkDialog"
      :is-confirm="true"
      :ok-text="$t('profile.linkage')"
      :ok-click="handleTwitterLoginLink"
    >
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('profile.twitter_link_modal_title') }}
      </v-card-text>
    </confirm-dialog>
    <confirm-dialog
      v-model="isOpenUnLinkDialog"
      :is-confirm="true"
      :ok-text="$t('profile.unlink')"
      :ok-click="() => confirmUnLink(targetUnLinkProvider)"
    >
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
.re-link {
  font-size: 11px;
  color: #2E263D8C;
  padding: 5px;
}
</style>
