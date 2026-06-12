<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { getPassCode } from '@/router/utils'

const notification = useNotification()

const currentUserStore = useCurrentUserStore()
const userEmail = computed({
  get: () => currentUserStore.personalInformation?.user_email ?? '',
  set: (val) => {
    if (currentUserStore.personalInformation != null) {
      currentUserStore.personalInformation.user_email = val
    }
  },
})

const router = useRouter()

const isLoading = ref(false)
const isValid = ref(false)

const { t: $t } = useI18n()

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  isLoading.value = true
  try {
    const email = userEmail.value
    await currentUserStore.requestEmailChange(email)
    await router.push(getPassCode(email))
  } catch (error) {
    console.warn('Error sending pass code:', error)
    if (error instanceof FirebaseError && error.code === 'functions/already-exists') {
      // profile から取ってきているは良い実装とは言えないが、同じ文言を複製するよりはマシなので
      // TODO: error_messages に移動する
      notification.show($t('profile.exist_email'), 'warning')
    } else {
      notification.show($t('error_messages.register_email'), 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container v-if="currentUserStore.firebaseUser !== null">
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container>
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h4 font-weight-bold">{{ $t('email.register_email') }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="mb-10">{{ $t('email.register_email_description') }}</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class="mb-4 pa-0">
              <label class="field-label" style="font-size: 12px; font-weight: bold">{{ $t('email.email') }}</label>
              <v-text-field
                placeholder="example@example.com"
                v-model="userEmail"
                :rules="[requiredValidator, emailValidator]"
              />
            </v-container>

            <v-btn
              class="mb-10"
              size="large"
              color="grey-900"
              block
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              {{ $t('email.send') }}
            </v-btn>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
