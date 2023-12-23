<script setup lang="ts">
import { useStoreCredential } from '@/stores/credential'
import { FirebaseError } from 'firebase/app'
import { getAuth, signInWithPopup, FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loginProvider = 'google' as 'facebook' | 'google'

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
}

const getFacebookCredential = async () => {
  const provider = new FacebookAuthProvider()
  provider.addScope('public_profile')
  provider.setCustomParameters({
    display: 'popup',
  })

  //FIXME - signInWithRedirect を使う
  const result = await signInWithPopup(getAuth(), provider)
  return result
}

const handleFacebookLogin = async () => {
  try {
    const result = await getFacebookCredential()
    const credential = FacebookAuthProvider.credentialFromResult(result)
    if (credential) {
      const store = useStoreCredential()
      store.update(credential)
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (credential && error.code === 'auth/account-exists-with-different-credential') {
        //TODO すでに登録されているときアカウントリンクをさせたい
        // const googleUser = await getGoogleCredential()
        // linkWithCredential(googleUser.user, credential)
        window.alert('Googleアカウントですでに登録されています')
      } else {
        window.alert('Facebookログインできませんでした')
      }
    } else {
      console.error({ error })
    }
  } finally {
    closeDialog()
  }
}

const getGoogleCredential = async () => {
  const provider = new GoogleAuthProvider()
  provider.addScope('profile')
  provider.addScope('openid')

  // FIXME - ドメイン切り替えたらsignInWithRedirect を使う。現状はRedirectだとスマホでログインできなくなる
  // await signInWithRedirect(getAuth(), provider)
  const result = await signInWithPopup(getAuth(), provider)
  return result
}

const handleGoogleLogin = async () => {
  try {
    getGoogleCredential()
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (credential && error.code === 'auth/account-exists-with-different-credential') {
        //TODO すでに登録されているときアカウントリンクをさせたい
        // const facebookUser = await getFacebookCredential()
        // linkWithCredential(facebookUser.user, credential)
        window.alert('Facebookアカウントですでに登録されています')
      } else {
        window.alert('Googleログインできませんでした')
      }
    } else {
      console.error({ error })
    }
  } finally {
    closeDialog()
  }
}
</script>

<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title v-if="loginProvider === 'facebook'" class="text-center mt-10">
        <div class="text-h5 ma-1">Facebookログイン</div>
      </v-card-title>
      <v-card-text v-if="loginProvider === 'facebook'">
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <button class="facebook-button login-button" @click="handleFacebookLogin">
                <span class="button-inner-text">Continue with Facebook</span>
              </button>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-title v-if="loginProvider === 'google'" class="text-center mt-10">
        <div class="text-h5 ma-1">ログイン</div>
      </v-card-title>
      <v-card-text v-if="loginProvider === 'google'">
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn class="login-button facebook-button" prepend-icon="mdi-facebook" color="#1877f2" @click="handleFacebookLogin">
                <span>Login with </span><span class="button-inner-text">Facebook</span>
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn class="login-button google-button" prepend-icon="mdi-google" color="grey-900" @click="handleGoogleLogin">
                <span>Login with </span><span class="button-inner-text">Google</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="closeDialog()">キャンセル</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.login-button {
  width: 345px;
  height: 54px;
  border-radius: 10px;
}

.facebook-button {
  .button-inner-text {
    margin-left: 5px;
    font-family: 'Helvetica';
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 23px;
    color: #ffffff;
  }
}

.google-button {
  .button-inner-text {
    margin-left: 5px;
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 23px;
    color: #ffffff;
  }
}
</style>
