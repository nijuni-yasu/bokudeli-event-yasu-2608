<script setup lang="ts">
import XIcon from '@shokujii/base/icons/x.js'
import FacebookIcon from '@shokujii/base/icons/facebook.vue'
import GoogleIcon from '@shokujii/base/icons/google.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import {
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
import { useValidators } from '@shokujii/base/composable/validators.js'
import type { VForm } from 'vuetify/components'
import { db, functions } from '@shokujii/base/firebase.js'
import { getDocs, query, collection, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { linkByProviderService } from '@shokujii/base/utils/providerService.js'
import { mdiUpload } from '@mdi/js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { generatePassCode } from '@shokujii/base/utils/generatePassCode.js'

type CustomData = {
  email: string
  _tokenResponse?: {
    providerId?: string
  }
}

const currentUserStore = useCurrentUserStore()
const {
  firebaseUser,
  user: currentUser,
  personalInformation: currentUserPersonalInformation,
} = storeToRefs(currentUserStore)
const email = computed(() => firebaseUser.value?.email)
const linkedProviderData = ref<string[]>([])

const updateProviderData = (user: User | null) => {
  linkedProviderData.value = user ? user.providerData.map((info) => info.providerId) : []
}

// 初期化（現在のユーザー情報を取得）
if (currentUser) {
  updateProviderData(toRaw(firebaseUser.value))
}

const userEmailPending = computed(() => {
  return currentUserPersonalInformation.value?.user_email_pending || null
})

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
  // TODO store で処理できるように
  const duplicatedUserAccount = await getDocs(query(collection(db, 'users'), where('user_account', '==', userAccount)))
  if (userAccount === currentUser.value?.user_account || userAccount === '') {
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
  if (!currentUser.value?.user_image_url && !userImage.value) {
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

  // firestoredUser.value = convertStoredUserToFirestoredUser(user.value as StoredUser)
  // firebaseUser.value..value.user_thumb_image_urls = buildThumbnailsLinks(
  //   firestoredUser.value.user_id,
  //   new URL(URL.createObjectURL(file)),
  // )
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

    await currentUserStore.updateUser(toRaw(currentUser.value!))
    if (image != undefined) {
      try {
        await currentUserStore.uploadUserImage(image)
        userImage.value = undefined
      } catch (err) {
        console.error(err)
        window.alert($t('profile.fail_image_upload'))
      }
    }

    Object.assign(notification, { message: $t('profile.update_profile'), color: 'success' })

    if (route.query.redirect) {
      route.query.redirect as string
    }
  } catch (error) {
    console.warn('Error profile submit:', error)
  } finally {
    isProfileLoading.value = false
  }
}

const emailSubmit = async () => {
  if (currentUser.value == null || currentUserPersonalInformation.value == null) {
    throw new Error('User is not logged in')
  }
  try {
    isEmailLoading.value = true

    const userEmail = email.value as string

    if (currentUserPersonalInformation.value?.user_email === userEmail) {
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

    currentUser.value.verified_at = undefined
    currentUserPersonalInformation.value.user_email_pending = userEmail
    await Promise.all([
      currentUserStore.updateUser(toRaw(currentUser.value)),
      currentUserStore.updatePersonalInformation(toRaw(currentUserPersonalInformation.value)),
    ])

    const passCode = generatePassCode()
    const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
    await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: userEmail, user_pass_code: passCode })
    return await router.push({
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
  const userEmail = currentUserPersonalInformation.value?.user_email_pending

  // パスコード再発行
  const reGeneratePassCode = generatePassCode()
  const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
  await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: reGeneratePassCode })

  const sendPassCode = httpsCallable(functions, 'send_pass_code')
  await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  return await router.push({
    path: '/pass-code',
    query: {
      email: userEmail,
      redirect: route.path,
    },
  })
}

const cancelPendingEmail = async () => {
  if (currentUser.value == null || currentUserPersonalInformation.value == null) {
    throw new Error('User is not logged in')
  }
  currentUser.value.user_pass_code = ''
  currentUser.value.verified_at = Date.now()
  currentUserPersonalInformation.value.user_email_pending = ''
  await Promise.all([
    currentUserStore.updateUser(toRaw(currentUser.value)),
    currentUserStore.updatePersonalInformation(toRaw(currentUserPersonalInformation.value)),
  ])
  return Object.assign(notification, { message: $t('user.canceled'), color: 'success' })
}

const handleFacebookLink = async () => {
  if (firebaseUser.value == null) {
    throw new Error('User is not logged in')
  }
  try {
    isSnsLoading.value = 'facebook.com'
    const userCredential = await linkByProviderService(firebaseUser.value, 'Facebook')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    updateProviderData(toRaw(firebaseUser.value))
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
  if (firebaseUser.value == null) {
    throw new Error('User is not logged in')
  }
  try {
    isSnsLoading.value = 'google.com'
    const userCredential = await linkByProviderService(firebaseUser.value, 'Google')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    updateProviderData(toRaw(firebaseUser.value))
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
  if (firebaseUser.value == null) {
    throw new Error('User is not logged in')
  }
  try {
    isSnsLoading.value = 'twitter.com'
    const userCredential = await linkByProviderService(toRaw(firebaseUser.value), 'Twitter')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    updateProviderData(toRaw(firebaseUser.value))
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', { snsName: 'X' }), color: 'error' })
      }
      if (error.code === 'auth/email-already-in-use') {
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
  if (firebaseUser.value == null || currentUser.value == null || currentUserPersonalInformation.value == null) {
    throw new Error('User is not logged in')
  }
  if (!providerId) return
  try {
    isSnsLoading.value = providerId as 'google.com' | 'facebook.com' | 'twitter.com'

    await unlink(toRaw(firebaseUser.value), providerId)

    // 各プロバイダーは連携解除時に関連する値を削除する
    switch (providerId) {
      case 'google.com':
        currentUserPersonalInformation.value.user_sns_google = ''
        break
      case 'facebook.com':
        currentUser.value.user_sns_facebook_name = ''
        break
      case 'twitter.com':
        currentUser.value.user_sns_twitter = ''
        currentUserPersonalInformation.value.user_sns_twitter_access_token = ''
        currentUserPersonalInformation.value.user_sns_twitter_secret = ''
        break
    }

    await Promise.all([
      currentUserStore.updateUser(toRaw(currentUser.value)),
      currentUserStore.updatePersonalInformation(toRaw(currentUserPersonalInformation.value)),
    ])

    // ユーザー情報を再取得して更新
    updateProviderData(toRaw(firebaseUser.value))
  } catch (error) {
    console.error(error)
  } finally {
    isSnsLoading.value = null
  }
}

onMounted(async () => {
  const userCredential = useCurrentUserStore().userCredential
  const additionalUserInfo = useCurrentUserStore().additionalUserInfo
  const error = useCurrentUserStore().lastFirebaseError
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
      return Object.assign(notification, {
        message: $t('user.exists_credential', { snsName: snsName }),
        color: 'error',
      })
    }
    if (error.code === 'auth/email-already-in-use') {
      return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
    }
  } else if (error) {
    console.error({ error })
  }

  if (!userCredential || additionalUserInfo === null) return
  isSnsLoading.value = additionalUserInfo.providerId as 'google.com' | 'facebook.com' | 'twitter.com'
  await setSNSProfile(userCredential, additionalUserInfo)
  isSnsLoading.value = null
})

const setSNSProfile = async (userCredential: UserCredential, additionalUserInfo: AdditionalUserInfo) => {
  // const storedUser = currentUserStore.storedUser as StoredUser
  if (firebaseUser.value == null || currentUser.value == null || currentUserPersonalInformation.value == null) {
    throw new Error('User is not logged in')
  }
  switch (additionalUserInfo.providerId) {
    case 'facebook.com':
      currentUser.value.user_sns_facebook_name =
        currentUser.value.user_sns_facebook_name || (additionalUserInfo.profile?.name as string)
      await currentUserStore.updateUser(toRaw(currentUser.value))
      break
    case 'twitter.com':
      currentUser.value.user_sns_twitter = additionalUserInfo?.username as string

      var twitterCredential = TwitterAuthProvider.credentialFromResult(userCredential)
      if (twitterCredential?.accessToken && twitterCredential.secret) {
        currentUserPersonalInformation.value.user_sns_twitter_access_token =
          currentUserPersonalInformation.value.user_sns_twitter_access_token || twitterCredential.accessToken
        currentUserPersonalInformation.value.user_sns_twitter_secret =
          currentUserPersonalInformation.value.user_sns_twitter_secret || twitterCredential.secret
        if (
          currentUserPersonalInformation.value.user_sns_twitter_access_token &&
          currentUserPersonalInformation.value.user_sns_twitter_secret
        ) {
          await currentUserStore.updatePersonalInformation(toRaw(currentUserPersonalInformation.value))
        }
      }
      break
    case 'google.com':
      currentUserPersonalInformation.value.user_sns_google = additionalUserInfo?.profile?.email as string
      await currentUserStore.updatePersonalInformation(toRaw(currentUserPersonalInformation.value))
      break
  }
}
</script>

<template>
  <v-container v-if="currentUser != null" class="px-1">
    <v-form ref="form" v-model="isValidProfile" @submit.prevent="profileSubmit">
      <v-row justify="center" class="mt-1 mt-md-16 px-1">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
            <div class="text-center text-h3 font-weight-bold">{{ $t('profile.profile_settings') }}</div>

            <v-sheet class="d-flex justify-center mt-4 mb-12">
              <div style="position: relative">
                <UserAvatar :user="currentUser" :size="140" @click="triggerFileInput" />
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
                v-model="currentUser.user_name"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
              />

              <v-text-field
                :label="$t('profile.user_account')"
                v-model="currentUser.user_account"
                prefix="shokujii.jp/u/"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[isValidSameAccount, accountValidator]"
                ref="accountFieldRef"
                @update:modelValue="checkAccountExists"
              />

              <v-textarea
                :label="$t('profile.user_description')"
                v-model="currentUser.user_description"
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
                v-model="currentUser.user_sns_twitter"
                prefix="x.com/"
                variant="outlined"
                hide-details
                :disabled="!!currentUser.user_sns_twitter"
                readonly
                @click="() => (isOpenTwitterLinkDialog = true)"
              />

              <v-text-field
                :label="$t('profile.user_sns_facebook')"
                v-model="currentUser.user_sns_facebook"
                prefix="facebook.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_instagram')"
                v-model="currentUser.user_sns_instagram"
                prefix="instagram.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_website')"
                v-model="currentUser.user_sns_website"
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

          <v-card-text v-if="userEmailPending">
            <div class="py-1" v-html="$t('profile.pending_email', { pending_email: userEmailPending })" />
            <div class="py-1 text-error text-subtitle-2">{{ $t('profile.notice_pending_email') }}</div>
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
            <div class="text-subtitle-1 mt-3 mb-10">{{ $t('profile.email_description') }}</div>
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
              <label v-if="currentUserPersonalInformation?.user_sns_google" class="ml-11 font-weight-bold">{{
                currentUserPersonalInformation.user_sns_google
              }}</label>
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
              <label v-if="currentUser.user_sns_facebook_name" class="ml-11 font-weight-bold">
                {{ currentUser.user_sns_facebook_name }}
              </label>
              <label
                v-if="currentUser.user_sns_facebook_name && !linkedProviderData.includes('facebook.com')"
                class="ml-11 re-link"
                v-html="$t('profile.re_link')"
              />
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
              <label v-if="currentUser.user_sns_twitter" class="ml-11 font-weight-bold">{{
                currentUser.user_sns_twitter
              }}</label>
              <label
                v-if="currentUser.user_sns_twitter && !linkedProviderData.includes('twitter.com')"
                class="ml-11 re-link"
                v-html="$t('profile.re_link')"
              />
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
      <v-card-text class="text-center py-5">{{ $t('profile.twitter_link_modal_description') }} </v-card-text>
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
  color: #2e263d8c;
  padding: 5px;
}
</style>
