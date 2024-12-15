<script setup lang="ts">
import { functions } from '@/firebase'
import {connectFunctionsEmulator, httpsCallable} from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'
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

const generatePassCode = (): string => {
  // 1～999999のランダムな整数を生成し、6桁にゼロ埋め
  return Math.floor(1 + Math.random() * 999999)
      .toString()
      .padStart(6, '0');
}

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
    const customToken = await verifyPassCode({ user_email: userEmail, pass_code: passCode.value })

    if (!customToken) {
      return isError.value = true
    }

    console.log(customToken);
    return true;

    // TODO: カスタムトークンログイン(ログインで、user_name、user_image_url、user_descriptoinが引ければ下記判定関数が不要)

    const userProfileExists = httpsCallable(functions, "user_profile_exists")
    const isProfileExists = await userProfileExists({ user_email: userEmail })
    if(isProfileExists) {
      router.push('/profile/setup')
    } else {
      router.push('/register/complete')

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