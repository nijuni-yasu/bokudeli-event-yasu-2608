<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import {
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  OAuthProvider,
  type AdditionalUserInfo,
  type User,
} from 'firebase/auth'
import type { User as BokudeliUser } from '@shokujii/common/schemas/User'
import { requestEmailLogin } from '@shokujii/base/apis/user'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { signInByProviderService, type ProviderIdType } from '@shokujii/base/utils/providerService.js'
import { getProfile } from '@/router/utils'
import logo from '@/assets/images/shokujii/shokujii_logo.png'

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()
const { requiredValidator, emailValidator } = useValidators()
const currentUserStore = useCurrentUserStore()

const isLoading = ref<ProviderIdType | 'custom' | null>(null)
const isValid = ref(false)
const email = ref('')
const linkRequestDialogParams = ref<{
  tryLoginProviderId: ProviderIdType
  linkProviderId: ProviderIdType | 'custom'
  email?: string
} | null>(null)

const handleLogin = async (providerId: ProviderIdType | 'custom', email?: string, redirect?: string) => {
  isLoading.value = providerId
  try {
    if (providerId === 'custom') {
      if (email == null) {
        throw new Error('Email is required')
      }
      const response = await requestEmailLogin({
        email,
      })
      const { isNew } = response.data
      await router.push({
        path: '/pass-code',
        query: {
          email,
          isnew: isNew ? 'true' : 'false',
          redirect,
        },
      })
    } else {
      const userCredential = await signInByProviderService(providerId)
      // ここに来るのはポップアップ認証（デバッグ用）成功時のみ
      // リダイレクト認証は handleRedirect へ
      await transitionJudge(userCredential.user, getAdditionalUserInfo(userCredential) ?? undefined)
    }
  } catch (error) {
    console.error(error)
    notification.show($t('login.login_fail', { sns_name: $t(`sns_name['${providerId}']`) }), 'error')
  } finally {
    isLoading.value = null
  }
}

const transitionJudge = async (user: User, additionalUserInfo?: AdditionalUserInfo) => {
  const email = user.email ?? additionalUserInfo?.profile?.email
  const isNewUser = additionalUserInfo?.isNewUser

  // メールアドレスが無い場合はメールアドレス設定へ
  if (email == null || email === '') {
    return await router.push({
      path: '/register/email',
      query: {
        redirect: route.query.redirect,
      },
    })
  }

  const currentUser = await new Promise<BokudeliUser>((resolve) => {
    const unwatch = watch(
      () => currentUserStore.user,
      (currentUser) => {
        if (currentUser != null) {
          nextTick(() => {
            unwatch()
            resolve(currentUser)
          })
        }
      },
      { immediate: true },
    )
  })

  // プロフィールが埋まっていれば
  if (currentUser.user_name && currentUser.user_description && currentUser.user_image_url) {
    if (isNewUser) {
      // 初回登録ユーザーならプロフィール設定ページへ
      return await router.push({
        path: getProfile(),
        query: {
          isnew: isNewUser ? 'true' : 'false',
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
      isnew: isNewUser ? 'true' : 'false',
      redirect: route.query.redirect,
    },
  })
}

onMounted(async () => {
  // redirect の処理をここで行うのは得策ではないが、ダイアログを出すためだけに router で複雑な処理を行うより
  // currentUserStore + onMounted の方がシンプルな実装になると判断
  // 将来的に、さらに複雑な処理を行う場合は構造を変えた方がよい
  try {
    const userCredential = await getRedirectResult(getAuth())

    const currentUser = getAuth().currentUser
    if (currentUser != null) {
      const additionalUserInfo =
        userCredential == null ? undefined : (getAdditionalUserInfo(userCredential) ?? undefined)
      transitionJudge(currentUser, additionalUserInfo)
    }
  } catch (err: unknown) {
    // 既に同じ email のアカウントが存在している場合、そのアカウントでログインしてからリンクする必要がある
    // ただし、 google.com と gmail は自動的にリンクされるのでこの限りではない
    if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
      const pendingCred = OAuthProvider.credentialFromError(err)
      const email = err.customData?.email as string
      if (pendingCred != null && email != null /* false になることは無いはずだが念の為 */) {
        const methods = await fetchSignInMethodsForEmail(getAuth(), email)
        const existingProviderId = methods[0]
        let linkProviderId: ProviderIdType | 'custom'
        if (existingProviderId == null) {
          // カスタムトークンログインを行い、メールアドレスが既に存在している場合
          linkProviderId = 'custom'
        } else {
          linkProviderId = existingProviderId as ProviderIdType
        }
        linkRequestDialogParams.value = {
          tryLoginProviderId: pendingCred.providerId as ProviderIdType,
          linkProviderId,
          email,
        }
      }
    }
  }
})
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

          <v-form
            v-model="isValid"
            @submit.prevent="handleLogin('custom', email, route.query.redirect as string | undefined)"
          >
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
              :loading="isLoading === 'custom'"
              :disabled="!isValid || (isLoading !== null && isLoading !== 'custom')"
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
            :loading="isLoading === 'twitter.com'"
            :disabled="isLoading !== null && isLoading !== 'twitter.com'"
            @click="handleLogin('twitter.com')"
          >
            {{ $t('login.sns_login', { sns_name: 'X' }) }}
          </v-btn>
          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :loading="isLoading === 'facebook.com'"
            :disabled="isLoading !== null && isLoading !== 'facebook.com'"
            @click="handleLogin('facebook.com')"
          >
            {{ $t('login.sns_login', { sns_name: 'Facebook' }) }}
          </v-btn>
          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :loading="isLoading === 'google.com'"
            :disabled="isLoading !== null && isLoading !== 'google.com'"
            @click="handleLogin('google.com')"
          >
            {{ $t('login.sns_login', { sns_name: 'Google' }) }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
  <confirm-dialog
    v-if="linkRequestDialogParams !== null"
    :model-value="linkRequestDialogParams !== null"
    :is-confirm="true"
    :ok-text="$t('profile.linkage')"
    :ok-click="() => handleLogin(linkRequestDialogParams!.linkProviderId, linkRequestDialogParams?.email, '/login')"
    :cancel-click="
      () => {
        linkRequestDialogParams = null
      }
    "
  >
    <v-card-text class="text-center py-10 text-h4"> アカウント連携 </v-card-text>
    <v-card-text class="pb-0">
      <p
        v-html="
          $t('login.link_dialog_body', {
            try_login_provider_label: $t(`sns_name['${linkRequestDialogParams.tryLoginProviderId}']`),
            link_provider_label: $t(`sns_name['${linkRequestDialogParams.linkProviderId}']`),
          })
        "
      />
    </v-card-text>
  </confirm-dialog>
</template>
