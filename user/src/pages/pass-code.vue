<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { getHomePath, getLogin, getRegister, getRegisterComplete, parsePassCodeMode } from '@/router/utils'
import {
  confirmEmailLogin,
  confirmEmailRegistration,
  requestEmailLogin,
  requestEmailRegistration,
} from '@shokujii/base/apis/user'
import { getRedirectPath } from '@shokujii/base/utils/redirect'

const router = useRouter()
const route = useRoute()

const { t: $t } = useI18n()
const notification = useNotification()

const currentUserStore = useCurrentUserStore()

const isLoading = ref(false)
const isValid = ref(false)

const isLogin = getAuth().currentUser?.uid != null
const rawEmail = history.state?.email as string | undefined
const mode = parsePassCodeMode(history.state?.mode)
const hasEmail = typeof rawEmail === 'string' && rawEmail.length > 0

if (!hasEmail) {
  if (isLogin) {
    await router.replace(getHomePath())
  } else {
    await router.replace(mode === 'register' ? getRegister() : getLogin())
  }
}

const email = hasEmail ? rawEmail : ''

const passCode = ref('')
const isOpenUnMatchPassCodeDialog = ref(false)
const isOpenLinkDialog = ref(route.query.pid != null)

if (hasEmail) {
  watch(passCode, async (newValue) => {
    if (newValue.length === 6) {
      await submit(newValue)
    }
  })
}

const reSendPassCode = async () => {
  isLoading.value = true
  try {
    if (isLogin) {
      await currentUserStore.requestEmailChange(email)
    } else if (mode === 'register') {
      await requestEmailRegistration({ email })
    } else {
      await requestEmailLogin({ email })
    }
  } catch (error) {
    if (mode === 'register' && error instanceof FirebaseError && error.code === 'functions/already-exists') {
      notification.show($t('register.already_registered'), 'warning')
      await router.push(getLogin())
      return
    }
    console.warn('Error resending pass code:', error)
  } finally {
    isLoading.value = false
  }
}

const submit = async (passCodeInput: string) => {
  isValid.value = true
  try {
    if (isLogin) {
      // Email Change の場合
      await currentUserStore.confirmEmailChange(email, passCodeInput)
      const redirectPath = getRedirectPath() ?? '/'
      await router.push(redirectPath)
    } else if (mode === 'register') {
      const result = await confirmEmailRegistration({ email, passCode: passCodeInput })
      const { token } = result.data
      await signInWithCustomToken(getAuth(), token)
      await router.push(getRegisterComplete(true))
    } else {
      const result = await confirmEmailLogin({ email, passCode: passCodeInput })
      const { token } = result.data
      await signInWithCustomToken(getAuth(), token)
      const redirectPath = getRedirectPath() ?? '/'
      await router.push(redirectPath)
    }
  } catch (error: unknown) {
    if (mode === 'register' && error instanceof FirebaseError && error.code === 'functions/already-exists') {
      notification.show($t('register.already_registered'), 'warning')
      await router.push(getLogin())
      return
    }
    console.warn('Error sending pass code:', error)
    isOpenUnMatchPassCodeDialog.value = true
  } finally {
    isValid.value = false
  }
}

const goBack = () => {
  if (mode === 'register') {
    router.push(getRegister())
  } else {
    router.push(getLogin())
  }
}
</script>

<template>
  <v-container v-if="hasEmail">
    <v-row justify="center" class="mt-16">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-md-10 px-5">
          <v-container>
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">{{ $t('passcode.enter_passcode') }}</h1>
            </v-row>
            <v-row justify="center">
              <p>{{ $t('passcode.enter_passcode_description', { email: email }) }}</p>
            </v-row>
          </v-container>

          <v-otp-input autofocus :disabled="isLoading" :loading="isValid" v-model="passCode" />

          <v-btn
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValid"
            :loading="isLoading"
            @click="reSendPassCode"
          >
            {{ $t('passcode.resend') }}
          </v-btn>
          <v-btn
            v-if="!isLogin"
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValid"
            :loading="isLoading"
            @click="goBack"
          >
            {{ $t('passcode.back') }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog v-model="isOpenUnMatchPassCodeDialog" :is-confirm="false">
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('passcode.un_match_passcode') }}
      </v-card-text>
    </confirm-dialog>
    <confirm-dialog
      :model-value="isOpenLinkDialog"
      :is-confirm="false"
      :ok-text="$t('passcode.send_code')"
      :ok-click="
        () => {
          reSendPassCode()
          isOpenLinkDialog = false
        }
      "
    >
      <v-card-text class="text-center py-10 text-h4"> {{ $t('profile.account_linkage') }} </v-card-text>
      <v-card-text class="pb-0">
        {{ $t('passcode.link_dialog_body', { email, provider_label: $t(`sns_name['${route.query.pid}']`) }) }}
      </v-card-text>
    </confirm-dialog>
  </v-container>
</template>

<style scoped lang="scss">
.text-btn {
  color: black !important;
}
</style>
