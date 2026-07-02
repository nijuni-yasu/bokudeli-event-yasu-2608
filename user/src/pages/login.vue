<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { getAdditionalUserInfo } from 'firebase/auth'
import { requestEmailLogin } from '@shokujii/base/apis/user'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { signInByProviderService, type ProviderIdType } from '@shokujii/base/utils/providerService.js'
import GoogleIcon from '@shokujii/base/icons/google.vue'
import FacebookIcon from '@shokujii/base/icons/facebook.vue'
import XIcon from '@shokujii/base/icons/x'
import AuthEntryLayout from '@/components/auth/AuthEntryLayout.vue'
import { rejectNewUserOnLogin, signOutBestEffort } from '@/router/authEntryGuards'
import { getPassCode, getRegister } from '@/router/utils'

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()
const { requiredValidator, emailValidator } = useValidators()

const isLoading = ref<ProviderIdType | 'custom' | null>(null)
const isValid = ref(false)
const email = ref('')
const linkRequestDialogParams = computed<{
  tryLoginProviderId: ProviderIdType
  linkProviderId: ProviderIdType
} | null>(() => {
  return route.query.pid1 == null || route.query.pid2 == null
    ? null
    : {
        tryLoginProviderId: route.query.pid1 as ProviderIdType,
        linkProviderId: route.query.pid2 as ProviderIdType,
      }
})

const handleLogin = async (providerId: ProviderIdType | 'custom', emailInput?: string) => {
  isLoading.value = providerId
  try {
    if (providerId === 'custom') {
      if (emailInput == null) {
        throw new Error('Email is required')
      }
      await requestEmailLogin({
        email: emailInput,
      })
      await router.push(getPassCode(emailInput, 'login'))
    } else {
      const credential = await signInByProviderService(providerId)
      // ここに来るのはポップアップ認証（デバッグ用）成功時のみ
      const aui = getAdditionalUserInfo(credential)
      if (aui?.isNewUser === true) {
        try {
          await rejectNewUserOnLogin(credential)
        } catch (error) {
          console.error(error)
          await signOutBestEffort()
          notification.show($t('login.login_fail', { sns_name: $t(`sns_name['${providerId}']`) }), 'error')
          return
        }
        notification.show($t('login.not_registered'), 'warning')
        await router.push(getRegister())
        return
      }
      window.location.href = '/register/complete'
    }
  } catch (error) {
    console.error(error)
    if (providerId === 'custom' && error instanceof FirebaseError && error.code === 'functions/not-found') {
      notification.show($t('login.not_registered'), 'warning')
    } else {
      notification.show($t('login.login_fail', { sns_name: $t(`sns_name['${providerId}']`) }), 'error')
    }
  } finally {
    isLoading.value = null
  }
}
</script>

<template>
  <auth-entry-layout mode="login">
    <template #description>
      <div v-html="$t('login.please_login_below')" />
    </template>

    <v-btn
      class="mb-4"
      size="large"
      color="grey-900"
      block
      :loading="isLoading === 'google.com'"
      :disabled="isLoading !== null && isLoading !== 'google.com'"
      @click="handleLogin('google.com')"
    >
      <template #prepend>
        <v-icon :icon="GoogleIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('login.sns_login', { sns_name: 'Google' }) }}
      </div>
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
      <template #prepend>
        <v-icon :icon="FacebookIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('login.sns_login', { sns_name: 'Facebook' }) }}
      </div>
    </v-btn>
    <v-btn
      class="mb-4"
      size="large"
      color="grey-900"
      block
      :loading="isLoading === 'twitter.com'"
      :disabled="isLoading !== null && isLoading !== 'twitter.com'"
      @click="handleLogin('twitter.com')"
    >
      <template #prepend>
        <v-icon :icon="XIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('login.sns_login', { sns_name: 'X' }) }}
      </div>
    </v-btn>
    <v-divider class="my-6" color="grey-lighten-3" />
    <v-form v-model="isValid" @submit.prevent="handleLogin('custom', email)">
      <v-container class="mb-4 pa-0">
        <label class="field-label" style="font-size: 12px; font-weight: bold">{{ $t('login.email') }}</label>
        <v-text-field placeholder="example@example.com" v-model="email" :rules="[requiredValidator, emailValidator]" />
      </v-container>

      <v-btn
        class="mb-4"
        size="large"
        color="grey-900"
        block
        :loading="isLoading === 'custom'"
        :disabled="!isValid || (isLoading !== null && isLoading !== 'custom')"
        type="submit"
      >
        {{ $t('login.continue_email_login') }}
      </v-btn>
    </v-form>

    <template #footer>
      <v-row justify="center">
        <div v-html="$t('login.link_to_partner_site')" />
      </v-row>
    </template>
  </auth-entry-layout>
  <confirm-dialog
    v-if="linkRequestDialogParams !== null"
    :model-value="linkRequestDialogParams !== null"
    :is-confirm="false"
    :ok-text="$t('profile.linkage')"
    :ok-click="() => handleLogin(linkRequestDialogParams!.linkProviderId, undefined)"
  >
    <v-card-text class="text-center py-10 text-h4"> {{ $t('profile.account_linkage') }} </v-card-text>
    <v-card-text class="pb-0">
      {{
        $t('login.link_dialog_body', {
          try_login_provider_label: $t(`sns_name['${linkRequestDialogParams.tryLoginProviderId}']`),
          link_provider_label: $t(`sns_name['${linkRequestDialogParams.linkProviderId}']`),
        })
      }}
    </v-card-text>
  </confirm-dialog>
</template>
