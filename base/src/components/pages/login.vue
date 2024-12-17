<script setup lang="ts">
import { functions } from '@/firebase'
import {connectFunctionsEmulator, httpsCallable} from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'
// TODO: 開発用
connectFunctionsEmulator(functions, 'localhost', 5001);
const router = useRouter()

const isLoading = ref(false)

const isValid = ref(false)
const email = ref('')

const generatePassCode = (): string => {
  // 1～999999のランダムな整数を生成し、6桁にゼロ埋め
  return Math.floor(1 + Math.random() * 999999)
      .toString()
      .padStart(6, '0')
}

const submit = async () => {
  isLoading.value = true
  try {
    const userEmail = email.value
    if (!userEmail) {
      throw new Error('Email is required')
    }

    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable(functions, "create_or_update_user")
    const { data } = await createOrUpdateUser({ user_email: userEmail, pass_code: passCode })

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: userEmail, pass_code: passCode })

    router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        new: Number(data.is_new),
      }
    })
  } catch (error) {
    console.warn("Error sending pass code:", error)
  } finally {
    isLoading.value = false
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
              <h1 class="my-3 text-h3 font-weight-bold">shokujiへようこそ</h1>
            </v-row>
            <v-row justify="center">
              <p>以下からログインまたは新規登録してください。</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class=" mb-4">
              <label class="field-label" style="font-size: 12px; font-weight: bold;">メールアドレス</label>
              <v-text-field placeholder="example@example.com" v-model="email"/>
            </v-container>

            <v-btn class="mb-10" size="large" color="grey-900" block :disabled="!isValid" :loading="isLoading" type="submit">
              メールアドレスで続ける
            </v-btn>
          </v-form>

          <v-btn class="mb-4" size="large" color="grey-900" block>
            Xでログイン
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block>
            Facebookでログイン
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block>
            Googleでログイン
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">


</style>