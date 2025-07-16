<script setup lang="ts">
import { db, functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { generatePassCode } from '@/utils/generatePassCode'
import { FirebaseError } from 'firebase/app'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  linkWithCredential,
  getAdditionalUserInfo,
  type UserCredential,
  signInWithCustomToken,
  type AdditionalUserInfo,
  OAuthCredential,
} from 'firebase/auth'
import { convertStoredUserToFirestoredUser } from '@/schemes/converter'
import { useValidators } from '@/composable/validators'
import { getCredentialWithPopup, signInByProviderService } from '@/utils/providerService'
import { useStoreUserAdditionalInfo } from '@/stores/userAdditionalInfo'
import { useStoreUserCredential } from '@/stores/userCredential'
import { useStoreFirebaseAuthError } from '@/stores/firebaseAuthError'
import { useStoreStoredUser } from '@/stores/storedUser'
import type { StoredUser } from '@/schemes/storedUser'
import { type UserStore, useUserStore } from '@/stores/user'
import { getProfile } from '@/router/utils'
import { doc, Timestamp, updateDoc } from 'firebase/firestore'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

type CreateUserRequest = {
  user_email: string
  user_pass_code: string
}

type CreateUserResponse = {
  is_new: boolean
}

type CustomData = {
  email: string
  _tokenResponse?: {
    verifiedProvider?: string[]
  }
}

const route = useRoute()
const router = useRouter()

const { t: $t } = useI18n()

const isLoading = ref(false)
const isSnsLoading = ref<'google.com' | 'facebook.com' | 'twitter.com' | null>(null)
const isDisable = ref(false)

const isValid = ref(false)
const email = ref('')

const isShowSnsLinkDialog = ref(false)
const tryLoginProvider = ref<'google.com' | 'facebook.com' | 'twitter.com' | null>(null)
const linkProvider = ref<'google.com' | 'facebook.com' | 'twitter.com' | null>(null)
const oAuthCredential = ref<OAuthCredential | null>(null)

const tryLoginProviderLabel = computed(() => {
  switch (tryLoginProvider.value) {
    case 'google.com':
      return 'Google'
    case 'facebook.com':
      return 'Facebook'
    case 'twitter.com':
      return 'X (Twitter)'
  }
})

const linkProviderLabel = computed(() => {
  switch (linkProvider.value) {
    case 'google.com':
      return 'Google'
    case 'facebook.com':
      return 'Facebook'
    case 'twitter.com':
      return 'X (Twitter)'
  }
})

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  isLoading.value = true
  isDisable.value = true
  try {
    const userEmail = email.value
    if (!userEmail) {
      throw new Error('Email is required')
    }

    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, 'create_or_update_user')
    const { data } = await createOrUpdateUser({ user_email: userEmail, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: userEmail, user_pass_code: passCode })

    router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        new: Number(data.is_new),
        redirect: route.query.redirect,
      },
    })
  } catch (error) {
    console.warn('Error sending pass code:', error)
  } finally {
    isLoading.value = false
    isDisable.value = false
  }
}

const handleTwitterLogin = async () => {
  isSnsLoading.value = 'twitter.com'
  try {
    const userCredential = await signInByProviderService('Twitter')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, 'get_custom_token')
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', { sns_name: 'X' }))

        await linkWithCredential(userCredential.user, credential)
          .then(async (userCredential) => {
            const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
            await transitionJudge(userCredential, additionalUserInfo)
          })
          .catch((error) => {
            console.error(error)
            window.alert($t('login.login_fail', { sns_name: 'X' }))
          })
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', { sns_name: 'X' }))
    }
  }
  isSnsLoading.value = null
}

const handleFacebookLogin = async () => {
  isSnsLoading.value = 'facebook.com'
  try {
    const userCredential = await signInByProviderService('Facebook')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, 'get_custom_token')
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', { sns_name: 'Facebook' }))

        await linkWithCredential(userCredential.user, credential)
          .then(async (userCredential) => {
            const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
            await transitionJudge(userCredential, additionalUserInfo)
          })
          .catch((error) => {
            console.error(error)
            window.alert($t('login.login_fail', { sns_name: 'Facebook' }))
          })
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', { sns_name: 'Facebook' }))
    }
  }
  isSnsLoading.value = null
}

const handleGoogleLogin = async () => {
  isSnsLoading.value = 'google.com'
  try {
    const userCredential = await signInByProviderService('Google')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, 'get_custom_token')
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', { sns_name: 'Google' }))

        await linkWithCredential(userCredential.user, credential)
          .then(async (userCredential) => {
            const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
            await transitionJudge(userCredential, additionalUserInfo)
          })
          .catch((error) => {
            console.error(error)
            window.alert($t('login.login_fail', { sns_name: 'Google' }))
          })
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', { sns_name: 'Google' }))
    }
  }
  isSnsLoading.value = null
}

const transitionJudge = async (userCredential: UserCredential, additionalUserInfo: AdditionalUserInfo) => {
  const email = userCredential.user.email ?? (additionalUserInfo?.profile?.email as string)
  const isNewUser = additionalUserInfo?.isNewUser

  const storedUserStore = useStoreStoredUser()

  await new Promise<void>((resolve) => {
    let unwatch: (() => void) | null = null

    unwatch = watch(
      () => storedUserStore.storedUser,
      (storedUser) => {
        if (storedUser) {
          if (unwatch) unwatch()
          resolve()
        }
      },
      { immediate: true },
    )
  })
  const storedUser = storedUserStore.storedUser as StoredUser
  const userStore = useUserStore(storedUser.userId) as UserStore
  const personalInformationSnapshotRef = doc(db, 'users_personal_information', storedUser.userId as string)

  switch (additionalUserInfo.providerId) {
    case 'facebook.com':
      storedUser.userSnsFacebookName = storedUser.userSnsFacebookName || (additionalUserInfo.profile?.name as string)

      if (!storedUser.userEmailPending && !storedUser.verifiedAt) {
        storedUser.verifiedAt = Timestamp.now().toDate()
      }

      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      break
    case 'twitter.com':
      storedUser.userSnsTwitter = storedUser.userSnsTwitter || (additionalUserInfo?.username as string)
      storedUser.userName = storedUser.userName || (additionalUserInfo.profile?.name as string)
      storedUser.userDescription =
        storedUser.userDescription || (additionalUserInfo.profile?.description as string | null)
      storedUser.userAccount = storedUser.userAccount || (additionalUserInfo.username as string | null)

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

      if (!storedUser.userEmailPending && !storedUser.verifiedAt) {
        storedUser.verifiedAt = Timestamp.now().toDate()
      }

      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      break
    case 'google.com':
      storedUser.userSnsGoogle = storedUser.userSnsGoogle || (additionalUserInfo?.profile?.email as string)

      if (!storedUser.userEmailPending && !storedUser.verifiedAt) {
        storedUser.verifiedAt = Timestamp.now().toDate()
      }

      storedUserStore.update(storedUser)
      await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
      await updateDoc(personalInformationSnapshotRef, { user_sns_google: storedUser.userSnsGoogle })
      break
    default:
      break
  }

  useStoreUserAdditionalInfo().reset()
  useStoreFirebaseAuthError().reset()

  // メールアドレスが無い場合はメールアドレス設定へ
  if (email === '' || !email) {
    return router.push({
      path: '/register/email',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      },
    })
  }

  // verifiedAtがnullかつuserEmailPendingがnullならパスコード認証を行う
  if (!storedUser.verifiedAt && !storedUser.userEmailPending) {
    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, 'create_or_update_user')
    const { data } = await createOrUpdateUser({ user_email: email, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: email, user_pass_code: passCode })

    return router.push({
      path: '/pass-code',
      query: {
        email: email,
        new: Number(Number(data.is_new)),
        sns: additionalUserInfo.providerId,
        redirect: route.query.redirect,
      },
    })
  }

  // プロフィールが埋まっていれば
  if (storedUser?.userName && storedUser?.userDescription && storedUser?.userImageUrl) {
    if (isNewUser) {
      // 初回登録ユーザーならプロフィール設定ページへ
      return router.push({
        path: getProfile(),
        query: {
          new: Number(isNewUser),
          redirect: route.query.redirect as string,
        },
      })
    } else if (route.query.redirect) {
      // 元いたページへ
      return router.push(route.query.redirect as string)
    } else {
      return router.push('/')
    }
  }

  // プロフィールが埋まっていなければ、登録完了（プロフィール登録誘導）へ
  return router.push({
    path: '/register/complete',
    query: {
      new: Number(isNewUser),
      redirect: route.query.redirect,
    },
  })
}

onMounted(async () => {
  const userCredential = useStoreUserCredential().userCredential
  const additionalUserInfo = useStoreUserAdditionalInfo().additionalUserInfo
  const error = useStoreFirebaseAuthError().error
  if (userCredential !== undefined && additionalUserInfo !== null) {
    try {
      isSnsLoading.value = additionalUserInfo.providerId as 'google.com' | 'facebook.com' | 'twitter.com'
      await transitionJudge(userCredential, additionalUserInfo)
    } catch (error) {
      console.error(error)
    }
  } else if (error && error.code === 'auth/account-exists-with-different-credential') {
    const tokenResponse = error.customData?._tokenResponse as { providerId: string }
    const providerId = tokenResponse.providerId as 'google.com' | 'facebook.com' | 'twitter.com'
    isSnsLoading.value = providerId
    tryLoginProvider.value = providerId

    let credential = null
    switch (providerId) {
      case FacebookAuthProvider.PROVIDER_ID:
        credential = FacebookAuthProvider.credentialFromError(error)
        break
      case GoogleAuthProvider.PROVIDER_ID:
        credential = GoogleAuthProvider.credentialFromError(error)
        break
      case TwitterAuthProvider.PROVIDER_ID:
        credential = TwitterAuthProvider.credentialFromError(error)
        break
    }
    console.error({ error, credential })

    let userCredential
    const customData = error?.customData as CustomData
    const verifiedProvider = customData?._tokenResponse?.verifiedProvider
    // カスタムトークンログインを行い、メールアドレスが既に存在している場合
    if (!verifiedProvider) {
      const getCustomToken = httpsCallable(functions, 'get_custom_token')
      const result = await getCustomToken({ user_email: customData?.email })
      const customToken = result.data as string

      userCredential = await signInWithCustomToken(getAuth(), customToken)

      if (!userCredential || !credential)
        return window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))

      await linkWithCredential(userCredential.user, credential)
        .then(async (userCredential) => {
          // アカウントリンク時、メールアドレス変更中でなければverifiedAtを埋める
          const storedUserStore = useStoreStoredUser()
          const storedUser = storedUserStore.storedUser as StoredUser
          if (!storedUser.userEmailPending && !storedUser.verifiedAt) {
            storedUser.verifiedAt = Timestamp.now().toDate()
            storedUserStore.update(storedUser)
            const userStore = useUserStore(storedUser.userId) as UserStore
            await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
          }

          const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
          await transitionJudge(userCredential, additionalUserInfo)
        })
        .catch((error) => {
          console.error(error)
          window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))
        })
      isSnsLoading.value = null
    } else {
      linkProvider.value = verifiedProvider[0] as 'google.com' | 'facebook.com' | 'twitter.com'
      oAuthCredential.value = credential
      isShowSnsLinkDialog.value = true
      return
    }
  }
  isSnsLoading.value = null
})

const handleLinkWithCredential = async () => {
  try {
    let userCredential: UserCredential | null = null
    switch (linkProvider.value) {
      case 'google.com':
        userCredential = await getCredentialWithPopup('Google')
        break
      case 'facebook.com':
        userCredential = await getCredentialWithPopup('Facebook')
        break
      case 'twitter.com':
        userCredential = await getCredentialWithPopup('Twitter')
        break
    }

    if (!userCredential || !oAuthCredential.value) {
      return window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))
    }

    await linkWithCredential(userCredential.user, oAuthCredential.value)
      .then(async (userCredential) => {
        // アカウントリンク時、メールアドレス変更中でなければverifiedAtを埋める
        const storedUserStore = useStoreStoredUser()
        const storedUser = storedUserStore.storedUser as StoredUser
        if (storedUser.userEmailPending === null) {
          storedUser.verifiedAt = Timestamp.now().toDate()
          storedUserStore.update(storedUser)
          const userStore = useUserStore(storedUser.userId) as UserStore
          await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
        }

        const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
        await transitionJudge(userCredential, additionalUserInfo)
      })
      .catch((error) => {
        console.error(error)
        window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))
      })
      .finally(() => {
        isShowSnsLinkDialog.value = false
      })
  } catch (error) {
    console.error(error)
    window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))
  }
}
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container class="mb-2">
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <div class="my-3 text-h3 font-weight-bold">{{ $t('login.welcome') }}</div>
            </v-row>
            <v-row justify="center" class="py-5 text-subtitle-1">
              <div v-html="$t('login.please_login_or_register_below')" />
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class="mb-4 pa-0">
              <label class="field-label" style="font-size: 12px; font-weight: bold">{{ $t('login.email') }}</label>
              <v-text-field
                placeholder="example@example.com"
                v-model="email"
                :rules="[requiredValidator, emailValidator]"
              />
            </v-container>

            <v-btn
              class="mb-12"
              size="large"
              color="grey-900"
              block
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              {{ $t('login.continue_email') }}
            </v-btn>
          </v-form>

          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :loading="isSnsLoading === 'twitter.com'"
            :disabled="(isSnsLoading !== null && isSnsLoading !== 'twitter.com') || isDisable"
            @click="handleTwitterLogin"
          >
            {{ $t('login.sns_login', { sns_name: 'X' }) }}
          </v-btn>
          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :loading="isSnsLoading === 'facebook.com'"
            :disabled="(isSnsLoading !== null && isSnsLoading !== 'facebook.com') || isDisable"
            @click="handleFacebookLogin"
          >
            {{ $t('login.sns_login', { sns_name: 'Facebook' }) }}
          </v-btn>
          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :loading="isSnsLoading === 'google.com'"
            :disabled="(isSnsLoading !== null && isSnsLoading !== 'google.com') || isDisable"
            @click="handleGoogleLogin"
          >
            {{ $t('login.sns_login', { sns_name: 'Google' }) }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog
      v-model="isShowSnsLinkDialog"
      :is-confirm="true"
      :ok-text="$t('profile.linkage')"
      :ok-click="handleLinkWithCredential"
      :cancelClick="
        () => {
          isShowSnsLinkDialog = false
          isSnsLoading = null
        }
      "
    >
      <v-card-text class="text-center py-10 text-h4"> アカウント連携 </v-card-text>
      <v-card-text class="pb-0">
        <p
          v-html="
            $t('login.link_dialog_body', {
              try_login_provider_label: tryLoginProviderLabel,
              link_provider_label: linkProviderLabel,
            })
          "
        />
      </v-card-text>
    </confirm-dialog>
  </v-container>
</template>
