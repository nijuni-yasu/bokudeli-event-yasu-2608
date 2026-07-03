<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { getAdditionalUserInfo } from 'firebase/auth'
import { requestEmailRegistration } from '@shokujii/base/apis/user'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { signInByProviderService, type ProviderIdType } from '@shokujii/base/utils/providerService.js'
import GoogleIcon from '@shokujii/base/icons/google.vue'
import FacebookIcon from '@shokujii/base/icons/facebook.vue'
import XIcon from '@shokujii/base/icons/x'
import AuthEntryLayout from '@/components/auth/AuthEntryLayout.vue'
import { rejectExistingUserOnRegister } from '@/router/authEntryGuards'
import { getLogin, getPassCode } from '@/router/utils'

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()
const { requiredValidator, emailValidator } = useValidators()

const isLoading = ref<ProviderIdType | 'custom' | null>(null)
const isValid = ref(false)
const email = ref('')
const linkRequestDialogParams = computed<{
  tryRegisterProviderId: ProviderIdType
  linkProviderId: ProviderIdType
} | null>(() => {
  return route.query.pid1 == null || route.query.pid2 == null
    ? null
    : {
        tryRegisterProviderId: route.query.pid1 as ProviderIdType,
        linkProviderId: route.query.pid2 as ProviderIdType,
      }
})

const handleRegister = async (providerId: ProviderIdType | 'custom', emailInput?: string) => {
  isLoading.value = providerId
  try {
    if (providerId === 'custom') {
      if (emailInput == null) {
        throw new Error('Email is required')
      }
      await requestEmailRegistration({
        email: emailInput,
      })
      await router.push(getPassCode(emailInput, 'register'))
    } else {
      const credential = await signInByProviderService(providerId)
      // ここに来るのはポップアップ認証（デバッグ用）成功時のみ
      const aui = getAdditionalUserInfo(credential)
      if (aui?.isNewUser === false) {
        notification.show($t('register.already_registered'), 'warning')
        try {
          await rejectExistingUserOnRegister()
        } catch (error) {
          console.error(error)
        }
        await router.push(getLogin())
        return
      }
      window.location.href = '/register/complete'
    }
  } catch (error) {
    console.error(error)
    if (providerId === 'custom' && error instanceof FirebaseError && error.code === 'functions/already-exists') {
      notification.show($t('register.already_registered'), 'warning')
      await router.push(getLogin())
      return
    } else {
      notification.show($t('register.register_fail', { sns_name: $t(`sns_name['${providerId}']`) }), 'error')
    }
  } finally {
    isLoading.value = null
  }
}
</script>

<template>
  <auth-entry-layout mode="register">
    <template #description>
      <div v-html="$t('register.please_register_below')" />
    </template>

    <v-btn
      class="mb-4"
      size="large"
      color="grey-900"
      block
      :loading="isLoading === 'google.com'"
      :disabled="isLoading !== null && isLoading !== 'google.com'"
      @click="handleRegister('google.com')"
    >
      <template #prepend>
        <v-icon :icon="GoogleIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('register.sns_register', { sns_name: 'Google' }) }}
      </div>
    </v-btn>
    <v-btn
      class="mb-4"
      size="large"
      color="grey-900"
      block
      :loading="isLoading === 'facebook.com'"
      :disabled="isLoading !== null && isLoading !== 'facebook.com'"
      @click="handleRegister('facebook.com')"
    >
      <template #prepend>
        <v-icon :icon="FacebookIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('register.sns_register', { sns_name: 'Facebook' }) }}
      </div>
    </v-btn>
    <v-btn
      class="mb-4"
      size="large"
      color="grey-900"
      block
      :loading="isLoading === 'twitter.com'"
      :disabled="isLoading !== null && isLoading !== 'twitter.com'"
      @click="handleRegister('twitter.com')"
    >
      <template #prepend>
        <v-icon :icon="XIcon" size="22" />
      </template>
      <div class="ml-2">
        {{ $t('register.sns_register', { sns_name: 'X' }) }}
      </div>
    </v-btn>
    <v-divider class="my-6" color="grey-lighten-3" />
    <v-form v-model="isValid" @submit.prevent="handleRegister('custom', email)">
      <v-container class="mb-4 pa-0">
        <label class="field-label" style="font-size: 12px; font-weight: bold">{{ $t('register.email') }}</label>
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
        {{ $t('register.continue_email') }}
      </v-btn>
    </v-form>
  </auth-entry-layout>
  <confirm-dialog
    v-if="linkRequestDialogParams !== null"
    :model-value="linkRequestDialogParams !== null"
    :is-confirm="false"
    :ok-text="$t('profile.linkage')"
    :ok-click="() => handleRegister(linkRequestDialogParams!.linkProviderId, undefined)"
  >
    <v-card-text class="text-center py-10 text-h4"> {{ $t('profile.account_linkage') }} </v-card-text>
    <v-card-text class="pb-0">
      {{
        $t('register.link_dialog_body', {
          try_register_provider_label: $t(`sns_name['${linkRequestDialogParams.tryRegisterProviderId}']`),
          link_provider_label: $t(`sns_name['${linkRequestDialogParams.linkProviderId}']`),
        })
      }}
    </v-card-text>
  </confirm-dialog>
</template>
