<script setup lang="ts">
import { db, functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { getAuth, signInWithCustomToken, signOut, updateEmail, type User } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { collection, doc, getDocs, query, where, updateDoc, getDoc, Timestamp } from 'firebase/firestore'
import { generatePassCode } from '@/utils/generatePassCode'
import { FirestoredUser } from '@/schemes/storedUser'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { getLogin, getProfile } from '@/router/utils'
import { useStoreUserAdditionalInfo } from '@/stores/userAdditionalInfo'
import { useStoreFirebaseAuthError } from '@/stores/firebaseAuthError'

const router = useRouter()
const route = useRoute()

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const isLoading = ref(false)
const isValid = ref(false)
const isError = ref(false)

const email = ref(route.query.email as string)
const isNew = route.query.new
const passCode = ref('')
const isOpenUnMatchPassCodeDialog = ref(false)

watch(passCode, async (newValue) => {
  if (newValue.length === 6) {
    await submit()
  }
})

const login = async () => {
  useStoreUserAdditionalInfo().reset()
  useStoreFirebaseAuthError().reset()
  const auth = getAuth()
  await signOut(auth)

  return await router.push({
    path: getLogin(),
    query: {
      redirect: route.query.redirect as string,
    },
  })
}

const reSendPassCode = async () => {
  isLoading.value = true
  try {
    const userEmail = email.value
    const reGeneratePassCode = generatePassCode()

    if (isNew === undefined) {
      const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
      await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: reGeneratePassCode })
    } else {
      const createOrUpdateUser = httpsCallable(functions, 'create_or_update_user')
      await createOrUpdateUser({ user_email: userEmail, user_pass_code: reGeneratePassCode })
    }
    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  } catch (error) {
    console.warn('Error resending pass code:', error)
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  isValid.value = true
  try {
    const userEmail = email.value

    const verifyPassCode = httpsCallable(functions, 'verify_pass_code')
    let result
    if (isNew === undefined) {
      result = await verifyPassCode({ user_email_pending: userEmail, user_pass_code: passCode.value })
    } else {
      result = await verifyPassCode({ user_email: userEmail, user_pass_code: passCode.value })
    }

    const customToken = result.data as string

    if (!customToken) {
      return (isError.value = true)
    }

    if (isNew !== undefined) {
      // メールアドレスログインの場合、初回はfirebase authのIDが必ず空になるため、updateEmailで設定する。
      await signInWithCustomToken(getAuth(), customToken).then(async (userCredential) => {
        await updateEmail(userCredential.user as User, userEmail).catch((error) => console.error(error))
      })
    }

    const usersRef = collection(db, 'users')

    let personalInformationSnapshot
    if (isNew === undefined) {
      personalInformationSnapshot = await getDocs(
        query(collection(db, 'users_personal_information'), where('user_email_pending', '==', userEmail)),
      )
    } else {
      personalInformationSnapshot = await getDocs(
        query(collection(db, 'users_personal_information'), where('user_email', '==', userEmail)),
      )
    }

    const q = query(usersRef, where('user_id', '==', personalInformationSnapshot.docs[0].id))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const user: FirestoredUser[] = []
      querySnapshot.forEach((doc) => {
        const firestoredUser = new FirestoredUser(doc.data())
        user.push(firestoredUser)
      })

      if (isNew === undefined) {
        const currentUser = getAuth().currentUser
        const storedUserStore = useStoreStoredUser()
        const { storedUser } = storeToRefs(storedUserStore)
        const userRef = doc(db, 'users', storedUser.value?.userId as string)
        const personalInformationSnapshotRef = doc(db, 'users_personal_information', storedUser.value?.userId as string)

        await updateEmail(currentUser as User, userEmail)
          .then(async () => {
            await updateDoc(userRef, {
              verified_at: Timestamp.now(),
            })
            await updateDoc(personalInformationSnapshotRef, { user_email: userEmail, user_email_pending: null })
          })
          .catch(async (error) => {
            console.error(error)
            if (error.code === 'auth/requires-recent-login') {
              const getCustomToken = httpsCallable(functions, 'get_custom_token')
              const result = await getCustomToken({ user_email: currentUser?.email })
              const customToken = result.data as string

              await signInWithCustomToken(getAuth(), customToken).then(async (userCredential) => {
                await updateEmail(userCredential.user as User, userEmail)
                  .then(async () => {
                    await updateDoc(userRef, {
                      verified_at: Timestamp.now(),
                    })
                    await updateDoc(personalInformationSnapshotRef, { user_email: userEmail, user_email_pending: null })
                  })
                  .catch((error) => {
                    // 基本的にこのスコープのエラーが出る想定は無い
                    console.error(error)
                  })
              })
            } else if (error.code === 'auth/email-already-in-use') {
              return Object.assign(notification, { message: $t('profile.exists_email'), color: 'error' })
            }
          })
      }

      const isProfileCompleted = user[0].user_name && user[0].user_description && user[0].user_image_url
      if (isNew && isProfileCompleted && route.query.sns === 'twitter.com') {
        return await router.push({
          path: getProfile(),
          query: {
            new: Number(isNew),
            redirect: route.query.redirect,
          },
        })
      } else if (isNew === undefined || isProfileCompleted) {
        // プロフィールが完成していればログインページにアクセスする直前のページへ遷移
        // newが存在しない = メールアドレス変更時の場合
        return await router.push(route.query.redirect as string)
      } else {
        // プロフィール入力方法の選択ページに遷移
        return await router.push({
          path: '/register/complete',
          query: {
            new: Number(isNew),
            redirect: route.query.redirect,
          },
        })
      }
    }
  } catch (error) {
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
              <p>{{ $t('passcode.enter_passcode_description', { email: email }) }}</p>
            </v-row>
          </v-container>

          <v-otp-input
            autofocus
            :disabled="isLoading"
            :loading="isValid"
            :error="isError"
            :focus-all="isError"
            v-model="passCode"
          />

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
            v-if="route.query.new"
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValid"
            :loading="isLoading"
            @click="login"
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
