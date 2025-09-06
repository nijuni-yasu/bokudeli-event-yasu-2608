<script setup lang="ts">
import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { generatePassCode } from '@shokujii/base/utils/generatePassCode.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getAuth, updateEmail, signInWithCustomToken, type User } from 'firebase/auth'
import { useValidators } from '@shokujii/base/composable/validators.js'

const currentUserStore = useCurrentUserStore()
const userEmail = computed({
  get: () => currentUserStore.personalInformation?.user_email ?? '',
  set: (val) => {
    if (currentUserStore.personalInformation != null) {
      currentUserStore.personalInformation.user_email = val
    }
  },
})

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const isValid = ref(false)

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  if (
    currentUserStore.firebaseUser == null ||
    currentUserStore.user == null ||
    currentUserStore.personalInformation == null
  ) {
    throw new Error('Not logged in')
  }

  isLoading.value = true
  try {
    await currentUserStore.updatePersonalInformation(toRaw(currentUserStore.personalInformation))
    let isError = false

    const email = currentUserStore.personalInformation.user_email

    // Facebook or Twitterにメールアドレスの登録がない場合、firebase authのIDが空になるため、updateEmailで設定する。
    await updateEmail(toRaw(currentUserStore.firebaseUser), email).catch(async (error) => {
      if (error.code === 'auth/requires-recent-login') {
        const getCustomToken = httpsCallable(functions, 'get_custom_token')
        const result = await getCustomToken({ user_email: email })
        const customToken = result.data as string

        await signInWithCustomToken(getAuth(), customToken)
          .then(async (userCredential) => {
            await updateEmail(userCredential.user as User, email).catch((error) => console.error(error))
          })
          .catch((error) => {
            // 基本的にこのスコープのエラーが出る想定は無い
            isError = true
            console.error(error)
          })
      } else if (error.code === 'auth/email-already-in-use') {
        isError = true
        Object.assign(notification, { message: $t('user.exists_email'), color: 'error' })
      }
    })

    if (isError) return

    const passCode = generatePassCode()
    currentUserStore.user.user_pass_code = passCode

    await currentUserStore.updateUser(toRaw(currentUserStore.user))

    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: email, user_pass_code: passCode })

    return await router.push({
      path: '/pass-code',
      query: {
        email: email,
        new: Number(route.query.new),
        redirect: route.query.redirect,
      },
    })
  } catch (error) {
    console.warn('Error sending pass code:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container v-if="currentUserStore.firebaseUser !== null">
    <v-row justify="center" class="mt-16">
      <v-col md="5">
        <v-sheet class="rounded-lg py-14 px-12">
          <v-container>
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">{{ $t('email.register_email') }}</h1>
            </v-row>
            <v-row justify="center">
              <p>{{ $t('email.register_email_description') }}</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class="mb-4">
              <label class="field-label" style="font-size: 12px; font-weight: bold">{{ $t('email.email') }}</label>
              <v-text-field
                placeholder="example@example.com"
                v-model="userEmail"
                :rules="[requiredValidator, emailValidator]"
              />
            </v-container>

            <v-btn
              class="mb-10"
              size="large"
              color="grey-900"
              block
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              {{ $t('email.send') }}
            </v-btn>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
