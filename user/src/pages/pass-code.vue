<script setup lang="ts">
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { getHomePath, getLogin } from '@/router/utils'
import { confirmEmailLogin, requestEmailLogin } from '@shokujii/base/apis/user'
import { getRedirectPath } from '@shokujii/base/utils/redirect'

const router = useRouter()
const route = useRoute()

const { t: $t } = useI18n()

const currentUserStore = useCurrentUserStore()

const isLoading = ref(false)
const isValid = ref(false)

const email = route.query.email as string | undefined
const newEmail = route.query.newemail as string | undefined
if (email != null && getAuth().currentUser?.uid != null) {
  await router.push(getHomePath())
} else if (newEmail != null && getAuth().currentUser?.uid == null) {
  await router.push(getLogin())
} else if (email == null && newEmail == null) {
  if (getAuth().currentUser?.uid == null) {
    await router.push(getLogin())
  } else {
    await router.push(getHomePath())
  }
}

const passCode = ref('')
const isOpenUnMatchPassCodeDialog = ref(false)
const isOpenLinkDialog = ref(route.query.pid != null)

watch(passCode, async (newValue) => {
  if (newValue.length === 6) {
    await submit(newValue)
  }
})

const reSendPassCode = async () => {
  isLoading.value = true
  try {
    await requestEmailLogin({ email: email! })
  } catch (error) {
    console.warn('Error resending pass code:', error)
  } finally {
    isLoading.value = false
  }
}

const submit = async (passCode: string) => {
  isValid.value = true
  try {
    if (newEmail != null) {
      // Email Change の場合
      await currentUserStore.confirmEmailChange(newEmail, passCode)
      const redirectPath = getRedirectPath() ?? '/'
      return await router.push(redirectPath)
    }
    // Email Login
    const result = await confirmEmailLogin({ email: email!, passCode: passCode })
    const { token, isNew } = result.data
    await signInWithCustomToken(getAuth(), token)
    // 再読みこみしてリダイレクト時と同様の処理をさせる
    window.location.href = '/register/complete' + (isNew ? '?new' : '')
  } catch (error: any) {
    console.warn('Error sending pass code:', error)
    isOpenUnMatchPassCodeDialog.value = true
  } finally {
    isValid.value = false
  }
}
</script>

<template>
  <v-container>
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
              <p>{{ $t('passcode.enter_passcode_description', { email: email ?? newEmail }) }}</p>
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
            v-if="!newEmail"
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValid"
            :loading="isLoading"
            @click="router.push(getLogin())"
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
