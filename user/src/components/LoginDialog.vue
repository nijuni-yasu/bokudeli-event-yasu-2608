<script setup lang="ts">
import { useStoreCredential } from '@/stores/credential'
import { getAuth, signInWithPopup, FacebookAuthProvider } from 'firebase/auth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
}

const provider = new FacebookAuthProvider()
provider.addScope('public_profile')
provider.setCustomParameters({
  display: 'popup',
})

const handleFacebookLogin = async () => {
  try {
    const result = await signInWithPopup(getAuth(), new FacebookAuthProvider())
    const credential = FacebookAuthProvider.credentialFromResult(result)
    if (credential) {
      const store = useStoreCredential()
      store.update(credential)
    }
  } catch (error: any) {
    const credential = FacebookAuthProvider.credentialFromError(error)
    console.error({ error, credential })
  } finally {
    closeDialog()
  }
}
</script>

<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title class="text-center mt-10">
        <div class="text-h5 ma-1">Facebookログイン</div>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <button id="facebook-button" @click="handleFacebookLogin">
                <span class="button-inner-text">Continue with Facebook</span>
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
#facebook-button {
  width: 345px;
  height: 54px;

  background: #1877f2;
  border-radius: 10px;
}

.button-inner-text {
  font-family: 'Helvetica';
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 23px;
  color: #ffffff;
}
</style>
