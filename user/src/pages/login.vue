<script setup lang="ts">
import { requestEmailLogin } from '@shokujii/base/apis/user'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { signInByProviderService, type ProviderIdType } from '@shokujii/base/utils/providerService.js'
import logo from '@/assets/images/shokujii/shokujii_logo.png'

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

const handleLogin = async (providerId: ProviderIdType | 'custom', email?: string, redirect?: string) => {
  isLoading.value = providerId
  try {
    if (providerId === 'custom') {
      if (email == null) {
        throw new Error('Email is required')
      }
      await requestEmailLogin({
        email,
      })
      await router.push({
        path: '/pass-code',
        query: {
          email,
          redirect,
        },
      })
    } else {
      await signInByProviderService(providerId)
      // ここに来るのはポップアップ認証（デバッグ用）成功時のみ
      // 再読みこみしてリダイレクト時と同様の処理をさせる
      window.location.href = '/register/complete'
    }
  } catch (error) {
    console.error(error)
    notification.show($t('login.login_fail', { sns_name: $t(`sns_name['${providerId}']`) }), 'error')
  } finally {
    isLoading.value = null
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
            :loading="isLoading === 'twitter.com'"
            :disabled="isLoading !== null && isLoading !== 'twitter.com'"
            @click="handleLogin('twitter.com')"
          >
            {{ $t('login.sns_login', { sns_name: 'X' }) }}
          </v-btn>
          <v-divider class="my-6" color="grey-lighten-3" />
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
          <v-divider class="my-6" color="grey-lighten-3" />
          <v-container>
            <v-row justify="center" class="py-2 text-subtitle-2">
              <div v-html="$t('login.link_to_partner_site')" />
            </v-row>
            <v-row justify="center" class="py-2 text-subtitle-2">
              <div v-html="$t('login.link_to_forgot_account')" />
            </v-row>
          </v-container>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
  <confirm-dialog
    v-if="linkRequestDialogParams !== null"
    :model-value="linkRequestDialogParams !== null"
    :is-confirm="false"
    :ok-text="$t('profile.linkage')"
    :ok-click="() => handleLogin(linkRequestDialogParams!.linkProviderId, undefined, '/login')"
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
