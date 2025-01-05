<script setup lang="ts">
import {db, functions} from '@/firebase'
import {httpsCallable} from 'firebase/functions'
import { getAuth, signInWithCustomToken, updateEmail } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import {collection, getDocs, query, where} from "firebase/firestore";
import {generatePassCode} from "@/utils/generatePassCode";
import {FirestoredUser} from "@/schemes/storedUser";


const router = useRouter()
const route = useRoute()

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

    const userCredential = await signInWithCustomToken(getAuth(), customToken)
    if (!userCredential.user.email) {
      const updateEmail = httpsCallable(functions, "update_email")
      await updateEmail({ user_email: userEmail })
    }
    // TODO: fetchSignInMethodsForEmailを使用してアカウントリンクを行う

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("user_email", "==", userEmail))

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
              <h1 class="my-3 text-h3 font-weight-bold">パスコードを入力</h1>
            </v-row>
            <v-row justify="center">
              <p>{{email}}に送信した6桁のコードを入力してください。</p>
            </v-row>
          </v-container>

          <v-otp-input autofocus :disabled="isLoading" :loading="isValid" :error="isError" :focus-all="isError" v-model="passCode"/>

          <v-btn size="large" color="grey-900" variant="text" block :disabled="isValid" :loading="isLoading" @click="reSendPassCode">
            コードを再送信する
          </v-btn>
          <v-btn size="large" color="grey-900" variant="text" block :disabled="isValid" :loading="isLoading" to="/login">
            ログイン画面へ戻る
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