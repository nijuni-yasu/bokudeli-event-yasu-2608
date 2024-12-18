<script setup lang="ts">
import { functions } from '@/firebase'
import {connectFunctionsEmulator, httpsCallable} from 'firebase/functions'
import logo from "@/assets/images/shokujii/shokujii_logo_wide.png";
import {generatePassCode} from "@/utils/generatePassCode";

// TODO: 開発用。後ほど削除すること
connectFunctionsEmulator(functions, 'localhost', 5001);

const router = useRouter()

const isLoading = ref(false)

const isValid = ref(false)
const email = ref('')

const submit = async () => {
  isLoading.value = true
  try {
    const userEmail = email.value
    if (!userEmail) {
      throw new Error('Email is required')
    }

    const passCode = generatePassCode()

    // TODO: ログイン済みuserに対してemail登録

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: userEmail, pass_code: passCode })

    router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        // new: Number() TODO: ログイン済みuserから新規か既存を取得して渡す
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
              <h1 class="my-3 text-h3 font-weight-bold">メールアドレス登録</h1>
            </v-row>
            <v-row justify="center">
              <p>メールアドレスを登録してください。</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class=" mb-4">
              <label class="field-label" style="font-size: 12px; font-weight: bold;">メールアドレス</label>
              <v-text-field placeholder="example@example.com" v-model="email"/>
            </v-container>

            <v-btn class="mb-10" size="large" color="grey-900" block :disabled="!isValid" :loading="isLoading" type="submit">
              送信
            </v-btn>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">

</style>