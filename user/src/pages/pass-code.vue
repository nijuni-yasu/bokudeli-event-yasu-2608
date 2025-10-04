<script setup lang="ts">
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { getHomePath, getLogin } from '@/router/utils'
import { User as BokudeliUser } from '@shokujii/common/schemas/User.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { confirmEmailLogin, requestEmailLogin } from '@shokujii/base/apis/user'

const moveTo = async (path: string) => {
  await router.push({
    path,
    query: {
      redirect: route.query.redirect as string,
    },
  })
}

const router = useRouter()
const route = useRoute()

const notification = useNotification()
const { t: $t } = useI18n()

const currentUserStore = useCurrentUserStore()

const isLoading = ref(false)
const isValid = ref(false)

const isNew = route.query.isnew === undefined || (route.query.isnew as string) === 'false' ? false : true
const email = route.query.email as string | undefined
const newEmail = route.query.newemail as string | undefined
if (email != null && getAuth().currentUser?.uid != null) {
  moveTo(getHomePath())
}
if (newEmail != null && getAuth().currentUser?.uid == null) {
  moveTo(getLogin())
}
if (email == null && newEmail == null) {
  if (getAuth().currentUser?.uid == null) {
    moveTo(getLogin())
  } else {
    moveTo(getHomePath())
  }
}

const passCode = ref('')
const isOpenUnMatchPassCodeDialog = ref(false)

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
      return await router.push(route.query.redirect as string)
    }
    // Email Login
    const result = await confirmEmailLogin({ email: email!, passCode: passCode })
    const { token } = result.data
    await signInWithCustomToken(getAuth(), token)
    const user: BokudeliUser = await new Promise((resolve) => {
      const unwatch = watch(
        () => currentUserStore.user,
        (user) => {
          if (user != null) {
            nextTick(() => {
              unwatch()
              resolve(user)
            })
          }
        },
        { immediate: true },
      )
    })

    const isProfileCompleted = user.user_name && user.user_description && user.user_image_url
    if (isProfileCompleted) {
      // プロフィールが完成していればログインページにアクセスする直前のページへ遷移
      return await router.push(route.query.redirect as string)
    }
    return await router.push({
      path: '/register/complete',
      query: {
        isnew: isNew ? 'true' : 'false',
        redirect: route.query.redirect,
      },
    })
  } catch (error: any) {
    console.warn('Error sending pass code:', error)
    if (error.code === 'auth/email-already-in-use') {
      notification.show($t('profile.exists_email'), 'error')
    } else {
      isOpenUnMatchPassCodeDialog.value = true
    }
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
            v-if="isNew"
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValid"
            :loading="isLoading"
            @click="moveTo(getLogin())"
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
  </v-container>
</template>

<style scoped lang="scss">
.text-btn {
  color: black !important;
}
</style>
