<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { getAdditionalUserInfo, type UserCredential } from 'firebase/auth'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { signInByProviderService } from '@shokujii/base/utils/providerService.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getProfile } from '@/router/utils'
import { requestEmailLogin } from '@shokujii/base/apis/user'
import type { User } from '@shokujii/common/schemas/User'

const route = useRoute()
const router = useRouter()

const { t: $t } = useI18n()

const isLoading = ref(false)
const isSnsLoading = ref<'google.com' | 'facebook.com' | 'twitter.com' | null>(null)
const isDisable = ref(false)

const isValid = ref(false)
const email = ref('')

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  isLoading.value = true
  isDisable.value = true
  try {
    const userEmail = email.value
    if (!userEmail) {
      throw new Error('Email is required')
    }
    const response = await requestEmailLogin({
      email: userEmail,
    })
    const { isNew } = response.data
    return await router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        isnew: isNew ? 'true' : 'false',
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
    await transitionJudge(userCredential)
  } catch (error) {
    console.error(error)
    window.alert($t('login.login_fail', { sns_name: $t(`sns_name.${providerId}`) }))
  } finally {
    isSnsLoading.value = null
  }
}

const transitionJudge = async (userCredential: UserCredential) => {
  const additionalUserInfo = getAdditionalUserInfo(userCredential)
  const email = userCredential.user.email ?? additionalUserInfo?.profile?.email
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

  const currentUserStore = useCurrentUserStore()
  const currentUser = await new Promise<User>((resolve) => {
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
  </v-container>
</template>
