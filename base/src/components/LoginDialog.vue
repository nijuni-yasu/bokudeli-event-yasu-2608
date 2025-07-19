<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  linkWithCredential,
} from 'firebase/auth'
import { mdiFacebook, mdiGoogle } from '@mdi/js'

const loginProvider = 'google' as 'facebook' | 'google'

const isEnableLinkWithCredential = false

const dialog = defineModel<boolean>()

const closeDialog = () => {
  dialog.value = false
}

const signInByProviderService = async (providerService: 'Facebook' | 'Google') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
  }

  if (import.meta.env.DEV) {
    await signInWithPopup(getAuth(), provider)
  } else {
    await signInWithRedirect(getAuth(), provider)
  }
}

const getCredentialWithPopup = async (providerService: 'Facebook' | 'Google') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      provider.setCustomParameters({
        display: 'popup',
      })
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
  }

  return await signInWithPopup(getAuth(), provider)
}

const handleFacebookLogin = async () => {
  try {
    await signInByProviderService('Facebook')
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (credential && error.code === 'auth/account-exists-with-different-credential') {
        //TODO すでに登録されているときアカウントリンクをさせたい
        if (isEnableLinkWithCredential) {
          const googleUser = await getCredentialWithPopup('Google')
          linkWithCredential(googleUser.user, credential)
        }
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

const handleGoogleLogin = async () => {
  try {
    await signInByProviderService('Google')
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (credential && error.code === 'auth/account-exists-with-different-credential') {
        //TODO すでに登録されているときアカウントリンクをさせたい
        if (isEnableLinkWithCredential) {
          const facebookUser = await getCredentialWithPopup('Facebook')
          linkWithCredential(facebookUser.user, credential)
        }
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
        <div class="text-h3 ma-1">ログイン</div>
      </v-card-title>
      <v-card-text class="text-center py-5">
        <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a>
        および
        <a href="https://nijuni.notion.site/shokujii-26a5f4507e5343329d2b7c6bea51030b" target="_blank"
          >プライバシーポリシー</a
        >
        に同意してログインしてください。
      </v-card-text>
      <v-card-text v-if="loginProvider === 'google'">
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn
                class="login-button facebook-button"
                :prepend-icon="mdiFacebook"
                color="#1877f2"
                @click="handleFacebookLogin"
              >
                <span>Login with </span><span class="button-inner-text">Facebook</span>
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn
                class="login-button google-button"
                :prepend-icon="mdiGoogle"
                color="grey-900"
                @click="handleGoogleLogin"
              >
                <span>Login with </span><span class="button-inner-text">Google</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-text class="text-center py-5" style="font-size: 12px; color: #e91e63">
        ※注意※<br />
        LINE、Messenger、Facebookアプリなどのアプリ内ブラウザでは、ログインができません。<br />
        ChromeやSafariなどのブラウザからログインしてください。<br />
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
