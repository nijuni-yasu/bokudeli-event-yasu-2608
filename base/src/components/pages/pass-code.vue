<script setup lang="ts">
import {db, functions} from '@/firebase'
import {connectFunctionsEmulator, httpsCallable} from 'firebase/functions'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'
import {collection, getDocs, query, where} from "firebase/firestore";
import {generatePassCode} from "@/utils/generatePassCode";
// TODO: 開発用。後ほど削除すること
connectFunctionsEmulator(functions, 'localhost', 5001);


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

    const createOrUpdateUser = httpsCallable(functions, "create_or_update_user");
    await createOrUpdateUser({ user_email: userEmail, pass_code: reGeneratePassCode });

    const sendPassCode = httpsCallable(functions, "send_pass_code");
    await sendPassCode({ user_email: userEmail, pass_code: reGeneratePassCode });
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
    const result = await verifyPassCode({ user_email: userEmail, pass_code: passCode.value })

    const customToken = result.data as string

    if (!customToken) {
      return isError.value = true
    }

    await signInWithCustomToken(getAuth(), customToken)

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("user_email", "==", userEmail))

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // TODO: 型指定、おそらく既にどこかでされているからそれを当て込む
      const user = [];
      querySnapshot.forEach((doc) => {
        user.push({ id: doc.id, ...doc.data() })
      });

      const isProfileCompleted = user.user_name && user.user_description && user.user_image_url
      if(isProfileCompleted) {
        router.push('/register/complete')
      } else {
        router.push('/profile/setup')
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
              <v-img max-height="150" max-width="300" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">パスコードを入力</h1>
            </v-row>
            <v-row justify="center">
              <p>{{email}}に送信した6桁のコードを入力してください。</p>
            </v-row>
          </v-container>

          <v-otp-input autofocus :disabled="isLoading" :loading="isValid" :error="isError" :focus-all="isError" v-model="passCode"/>

          <v-btn size="large" color="gray-900" variant="text" block :disabled="isValid" :loading="isLoading" @click="reSendPassCode">
            コードを再送信する
          </v-btn>
          <v-btn size="large" color="gray-900" variant="text" block :disabled="isValid" :loading="isLoading" to="/login">
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