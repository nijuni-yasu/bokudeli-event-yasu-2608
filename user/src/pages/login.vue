<script setup lang="ts">
import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { generatePassCode } from '@shokujii/base/utils/generatePassCode.js'
import { FirebaseError } from 'firebase/app'
import {
  getAuth,
  TwitterAuthProvider,
  linkWithCredential,
  getAdditionalUserInfo,
  type UserCredential,
  signInWithCustomToken,
  type AdditionalUserInfo,
  OAuthCredential,
} from 'firebase/auth'
import { useValidators } from '@shokujii/base/composable/validators.js'
import {
  getCredentialWithPopup,
  getProviderClass,
  signInByProviderService,
} from '@shokujii/base/utils/providerService.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getProfile } from '@/router/utils'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

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

    return await router.push({
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

const handleLogin = async (providerId: 'google.com' | 'facebook.com' | 'twitter.com') => {
  isSnsLoading.value = providerId
  try {
    const userCredential = await signInByProviderService(providerId)
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = getProviderClass(providerId).credentialFromError(error)
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
          const vp = verifiedProvider[0] as 'google.com' | 'facebook.com' | 'twitter.com'
          userCredential = await signInByProviderService(vp)
        }

        if (!userCredential || !credential) {
          return window.alert($t('login.login_fail', { sns_name: $t(`sns_name.${providerId}`) }))
        }

        await linkWithCredential(userCredential.user, credential)
          .then(async (userCredential) => {
            const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
            await transitionJudge(userCredential, additionalUserInfo)
          })
          .catch((error) => {
            console.error(error)
            window.alert($t('login.login_fail', { sns_name: $t(`sns_name.${providerId}`) }))
          })
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', { sns_name: $t(`sns_name.${providerId}`) }))
    }
  }
  isSnsLoading.value = null
}

const transitionJudge = async (userCredential: UserCredential, additionalUserInfo: AdditionalUserInfo) => {
  const email = userCredential.user.email ?? (additionalUserInfo?.profile?.email as string)
  const isNewUser = additionalUserInfo?.isNewUser

  const currentUserStore = useCurrentUserStore()

  await new Promise<void>((resolve) => {
    let unwatch: (() => void) | null = null

    unwatch = watch(
      () => [currentUserStore.user, currentUserStore.personalInformation],
      () => {
        if (currentUserStore.user != null && currentUserStore.personalInformation != null) {
          if (unwatch) {
            unwatch()
          }
          resolve()
        }
      },
      { immediate: true },
    )
  })
  const currentUser = currentUserStore.user! // watch で null でないことを保証済み
  const currentUserPersonalInformation = currentUserStore.personalInformation! // watch で null でないことを保証済み

  switch (additionalUserInfo.providerId) {
    case 'facebook.com':
      currentUser.user_sns_facebook_name =
        currentUser.user_sns_facebook_name || (additionalUserInfo.profile?.name as string)

      if (!currentUserPersonalInformation.user_email_pending && !currentUser.verified_at) {
        currentUser.verified_at = Date.now()
      }

      await currentUserStore.updateUser(currentUser)
      break
    case 'twitter.com': {
      currentUser.user_sns_twitter = currentUser.user_sns_twitter || (additionalUserInfo?.username as string)
      currentUser.user_name = currentUser.user_name || (additionalUserInfo.profile?.name as string)
      currentUser.user_description = currentUser.user_description || (additionalUserInfo.profile?.description as string)

      const twitterCredential = TwitterAuthProvider.credentialFromResult(userCredential)
      if (twitterCredential?.accessToken && twitterCredential.secret) {
        currentUserPersonalInformation.user_sns_twitter_access_token =
          currentUserPersonalInformation.user_sns_twitter_access_token || twitterCredential.accessToken
        currentUserPersonalInformation.user_sns_twitter_secret =
          currentUserPersonalInformation.user_sns_twitter_secret || twitterCredential.secret

        if (
          currentUserPersonalInformation.user_sns_twitter_access_token &&
          currentUserPersonalInformation.user_sns_twitter_secret
        ) {
          await currentUserStore.updatePersonalInformation(currentUserPersonalInformation)
        }
      }

      if (!currentUserPersonalInformation.user_email_pending && !currentUser.verified_at) {
        currentUser.verified_at = Date.now()
      }

      await currentUserStore.updateUser(currentUser)
      break
    }
    case 'google.com':
      currentUserPersonalInformation.user_sns_google =
        currentUserPersonalInformation.user_sns_google || (additionalUserInfo?.profile?.email as string)

      if (!currentUserPersonalInformation.user_email_pending && !currentUser.verified_at) {
        currentUser.verified_at = Date.now()
      }

      await Promise.all([
        currentUserStore.updatePersonalInformation(currentUserPersonalInformation),
        currentUserStore.updateUser(currentUser),
      ])
      break
    default:
      break
  }

  // メールアドレスが無い場合はメールアドレス設定へ
  if (email === '' || !email) {
    return await router.push({
      path: '/register/email',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      },
    })
  }

  // verifiedAtがnullかつuserEmailPendingがnullならパスコード認証を行う
  if (!currentUser.verified_at && !currentUserPersonalInformation.user_email_pending) {
    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, 'create_or_update_user')
    const { data } = await createOrUpdateUser({ user_email: email, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: email, user_pass_code: passCode })

    return await router.push({
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
  if (currentUser.user_name && currentUser.user_description && currentUser.user_image_url) {
    if (isNewUser) {
      // 初回登録ユーザーならプロフィール設定ページへ
      return await router.push({
        path: getProfile(),
        query: {
          new: Number(isNewUser),
          redirect: route.query.redirect as string,
        },
      })
    } else if (route.query.redirect) {
      // 元いたページへ
      return await router.push(route.query.redirect as string)
    } else {
      return await router.push('/')
    }
  }

  // プロフィールが埋まっていなければ、登録完了（プロフィール登録誘導）へ
  return await router.push({
    path: '/register/complete',
    query: {
      new: Number(isNewUser),
      redirect: route.query.redirect,
    },
  })
}

const handleLinkWithCredential = async () => {
  try {
    const userCredential: UserCredential | null =
      linkProvider.value == null ? null : await getCredentialWithPopup(linkProvider.value)
    if (!userCredential || !oAuthCredential.value) {
      return window.alert($t('login.login_fail', { sns_name: tryLoginProviderLabel.value }))
    }

    await linkWithCredential(userCredential.user, oAuthCredential.value)
      .then(async (userCredential) => {
        // アカウントリンク時、メールアドレス変更中でなければverifiedAtを埋める
        const currentUserStore = useCurrentUserStore()
        const currentUser = currentUserStore.user
        const currentUserPersonalInformation = currentUserStore.personalInformation
        if (currentUser != null && currentUserPersonalInformation?.user_email_pending == null) {
          currentUser.verified_at = Date.now()
          await currentUserStore.updateUser(currentUser)
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
            @click="handleLogin('twitter.com')"
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
            @click="handleLogin('facebook.com')"
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
            @click="handleLogin('google.com')"
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
