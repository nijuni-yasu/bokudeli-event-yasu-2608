<script setup lang="ts">
import { getAuth, signInWithPopup, FacebookAuthProvider } from "firebase/auth"

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const closeDialog = () => {
  dialog.value = false
}

const handleFacebookLonin = async () => {
  try {
    const result = await signInWithPopup(getAuth(), new FacebookAuthProvider());
    const user = result.user;
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      console.log({result, credential, accessToken})
      closeDialog()
  } catch (error: any) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = FacebookAuthProvider.credentialFromError(error);
      console.error({ error })
      closeDialog()
    }
}
</script>

<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">ログイン</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <button id="facebook-button" @click="handleFacebookLonin">
                <span class="button-inner-text">Continue with Facebook</span>
              </button>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog">キャンセル</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
#facebook-button {
  width: 345px;
  height: 54px;

  background: #1877F2;
  border-radius: 10px;
}

.button-inner-text {
  font-family: 'Helvetica';
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 23px;
  color: #FFFFFF;
}
</style>