<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuth, checkActionCode, applyActionCode, signInWithCustomToken } from 'firebase/auth'
import { doc, Timestamp, updateDoc } from 'firebase/firestore'
import { db, functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'

const route = useRoute()
const router = useRouter()

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const restoredEmail = ref<string>('')
const currentEmail = ref<string>('')

onMounted(async () => {
  const mode = route.query.mode as string
  const oobCode = route.query.oobCode as string

  if (mode === 'recoverEmail' && oobCode) {
    const auth = getAuth()
    try {
      const info = await checkActionCode(auth, oobCode)
      restoredEmail.value = info.data.email as string
      currentEmail.value = info.data.previousEmail as string

      await applyActionCode(auth, oobCode)
        .then(async () => {
          const getCustomToken = httpsCallable(functions, 'get_custom_token')
          const result = await getCustomToken({ user_email: currentEmail.value })
          const customToken = result.data as string

          await signInWithCustomToken(getAuth(), customToken)

          await auth.currentUser?.reload()

          const uid = auth.currentUser?.uid
          if (uid && restoredEmail) {
            const userRef = doc(db, 'users', uid)
            await updateDoc(userRef, {
              verified_at: Timestamp.now(),
            })

            const personalInformationRef = doc(db, 'users_personal_information', uid)
            await updateDoc(personalInformationRef, {
              user_email: restoredEmail.value,
            })
            console.info('users_personal_informationの復元に成功しました。')
          } else {
            console.info('users_personal_informationの復元に失敗しました。')
          }

          Object.assign(notification, { message: $t('auth.action.notify_reset_email'), color: 'success' })
          return router.replace('/')
        })
        .then((error) => {
          console.error(error)
        })
    } catch (error) {
      console.error(error)
    }
  } else {
    return router.replace('/')
  }
})
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
              <div class="my-3 text-h3 font-weight-bold">{{ $t('auth.action.title') }}</div>
            </v-row>
            <v-row justify="center">
              <p
                class="font-weight-bold"
                v-html="$t('auth.action.reset_email', { current_email: currentEmail, restored_email: restoredEmail })"
              />
            </v-row>
          </v-container>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
