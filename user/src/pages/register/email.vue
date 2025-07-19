<script setup lang="ts">
import { db, functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { generatePassCode } from '@shokujii/base/utils/generatePassCode.js'
import { useStoreStoredUser } from '@shokujii/base/stores/storedUser.js'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import { FirestoredUser, type FirestoredUserPersonalInformation } from '@shokujii/base/schemes/storedUser.js'
import { convertFirestoredUserToStoredUser } from '@shokujii/base/schemes/converter.js'
import { getAuth, updateEmail, signInWithCustomToken, type User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useValidators } from '@shokujii/base/composable/validators.js'

const auth = getAuth()
const currentUser = auth.currentUser

const storedUserStore = useStoreStoredUser()
const { storedUser } = storeToRefs(useStoreStoredUser())
const user = computed(() => {
  const userId = storedUser.value?.userId
  return userId == null ? null : (useUserStore(userId) as UserStore).user
})
const userEmail = computed({
  get: () => storedUserStore.storedUser?.userEmail || '',
  set: (val) => {
    if (storedUserStore.storedUser) {
      storedUserStore.storedUser.userEmail = val
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
  isLoading.value = true
  try {
    const firestoredUser = user.value as FirestoredUser

    const personalInformationRef = doc(db, 'users_personal_information', firestoredUser.user_id)
    await setDoc(personalInformationRef, { user_email: userEmail.value })
    let isError = false

    const personalInformationSnapshot = await getDoc(personalInformationRef)
    const personalInformation = personalInformationSnapshot.data() as FirestoredUserPersonalInformation
    const email = personalInformation.user_email

    // Facebook or Twitterにメールアドレスの登録がない場合、firebase authのIDが空になるため、updateEmailで設定する。
    await updateEmail(currentUser as User, email).catch(async (error) => {
      if (error.code === 'auth/requires-recent-login') {
        const getCustomToken = httpsCallable(functions, 'get_custom_token')
        const result = await getCustomToken({ user_email: email })
        const customToken = result.data as string

        await signInWithCustomToken(auth, customToken)
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
    firestoredUser.user_pass_code = passCode

    storedUserStore.update(
      convertFirestoredUserToStoredUser(firestoredUser, personalInformation as FirestoredUserPersonalInformation),
    )

    const userStore = useUserStore(firestoredUser.user_id) as UserStore
    await userStore.updateUser(firestoredUser)

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
  <v-container v-if="user !== null">
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
