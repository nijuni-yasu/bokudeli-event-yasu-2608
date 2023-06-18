<script setup lang="ts">
import { useStoreCredential } from '@/stores/credential'
import { FirebaseError } from 'firebase/app'
import { getAuth, signInWithPopup, FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

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

const handleFacebookLogin = async () => {
  try {
    const provider = new FacebookAuthProvider()
    provider.addScope('public_profile')
    provider.setCustomParameters({
      display: 'popup',
    })

    const result = await signInWithPopup(getAuth(), provider)
    const credential = FacebookAuthProvider.credentialFromResult(result)
    if (credential) {
      const store = useStoreCredential()
      store.update(credential)
    }
  } catch (error: FirebaseError) {
    const credential = FacebookAuthProvider.credentialFromError(error)
    console.error({ error, credential })
  } finally {
    closeDialog()
  }
}

const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('openid')

    const result = await signInWithPopup(getAuth(), provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    if (credential) {
      const store = useStoreCredential()
      store.update(credential)
    }
  } catch (error: FirebaseError) {
    const credential = GoogleAuthProvider.credentialFromError(error)
    console.error({ error, credential })
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
        <div class="text-h5 ma-1">Googleログイン</div>
      </v-card-title>
      <v-card-text v-if="loginProvider === 'google'">
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <button class="google-button login-button" @click="handleGoogleLogin">
                <span class="button-inner-text">Continue with Google</span>
              </button>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="closeDialog">キャンセル</v-btn>
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
  background: #1877f2;
  .button-inner-text {
    font-family: 'Helvetica';
    font-style: normal;
    font-weight: 700;
    font-size: 20px;
    line-height: 23px;
    color: #ffffff;
  }
}

.google-button {
  background: #ffffff;
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.084), 0px 2px 3px rgba(0, 0, 0, 0.168);

  .button-inner-text {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 23px;

    color: rgba(0, 0, 0, 0.54);
  }
}
</style>
