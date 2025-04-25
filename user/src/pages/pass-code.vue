<script setup lang="ts">
import {db, functions} from '@/firebase'
import {httpsCallable} from 'firebase/functions'
import { getAuth, signInWithCustomToken, updateEmail, type User } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import {collection, getDocs, query, where} from "firebase/firestore";
import {generatePassCode} from "@/utils/generatePassCode";
import {FirestoredUser} from "@/schemes/storedUser";


const router = useRouter()
const route = useRoute()

const { t: $t } = useI18n()

const isLoading = ref(false)
const isValid = ref(false)
const isError = ref(false)

const email = ref(route.query.email as string)
const passCode = ref('')

watch(passCode, async (newValue) => {
  if (newValue.length === 6) {
    await submit();
  }
});

const login = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.query.redirect as string
    }
  })
}

const reSendPassCode = async () => {
  isLoading.value = true
  try {
    const userEmail = email.value
    const reGeneratePassCode = generatePassCode()

    const createOrUpdateUser = httpsCallable(functions, "create_or_update_user")
    await createOrUpdateUser({ user_email: userEmail, user_pass_code: reGeneratePassCode })

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  } catch (error) {
    console.warn("Error resending pass code:", error);
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  isValid.value = true
  try {
    const userEmail = email.value

    const verifyPassCode = httpsCallable(functions, "verify_pass_code")
    const result = await verifyPassCode({ user_email: userEmail, user_pass_code: passCode.value })

    const customToken = result.data as string

    if (!customToken) {
      return isError.value = true
    }

    // メールアドレスログインの場合、初回はfirebase authのIDが必ず空になるため、updateEmailで設定する。
    await signInWithCustomToken(getAuth(), customToken).then(async (userCredential) => {
      await updateEmail(userCredential.user as User, userEmail).catch((error) => console.error(error))
    })

    const usersRef = collection(db, "users");

    const personalInformationSnapshot = await getDocs(query(
        collection(db, 'users_personal_information'),
        where('user_email', '==', userEmail)
    ))
    const q = query(usersRef, where("user_id", "==", personalInformationSnapshot.docs[0].id))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const user: FirestoredUser[] = [];
      querySnapshot.forEach((doc) => {
        const firestoredUser = new FirestoredUser(doc.data());
        user.push(firestoredUser)
      })

      const isProfileCompleted = user[0].user_name && user[0].user_description && user[0].user_image_url
      if(isProfileCompleted) {
        // プロフィールが完成していればログインページにアクセスする直前のページへ遷移
        router.push(route.query.redirect as string)
      } else {
        // プロフィール入力方法の選択ページに遷移
        router.push({
          path: '/register/complete',
          query: {
            new: Number(route.query.new),
            redirect: route.query.redirect,
          }
        })
      }
    }
  } catch (error) {
    console.warn("Error sending pass code:", error);
  } finally {
    isValid.value = false
  }
}

</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col md="5">
        <v-sheet class="rounded-lg py-14 px-12">
          <v-container>
            <v-row justify="center" >
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">{{ $t('passcode.enter_passcode') }}</h1>
            </v-row>
            <v-row justify="center">
              <p>{{ $t('passcode.enter_passcode', {email: email}) }}</p>
            </v-row>
          </v-container>

          <v-otp-input autofocus :disabled="isLoading" :loading="isValid" :error="isError" :focus-all="isError" v-model="passCode"/>

          <v-btn size="large" color="grey-900" variant="text" block :disabled="isValid" :loading="isLoading" @click="reSendPassCode">
            {{ $t('passcode.resend') }}
          </v-btn>
          <v-btn size="large" color="grey-900" variant="text" block :disabled="isValid" :loading="isLoading" @click="login">
            {{ $t('passcode.back') }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
.text-btn {
  color: black!important;
}

</style>