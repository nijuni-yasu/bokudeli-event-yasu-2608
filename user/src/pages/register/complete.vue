<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { TwitterAuthProvider } from 'firebase/auth'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getProfile } from '@/router/utils'
import { useNotification } from '@shokujii/base/composable/notification'

const router = useRouter()

const notification = useNotification()
const { t: $t } = useI18n()

const titleLabel = ref('')
const descriptionLabel = ref('')
const selfButtonLabel = ref('')

const isLoading = ref(false)

const isNewUser = history.state?.isNewUser ?? false

if (isNewUser) {
  titleLabel.value = $t('complete.new_user_title')
  descriptionLabel.value = $t('complete.new_user_description')
  selfButtonLabel.value = $t('complete.new_user_selfButton')
} else {
  titleLabel.value = $t('complete.exists_user_title')
  descriptionLabel.value = $t('complete.exists_user_description')
  selfButtonLabel.value = $t('complete.exists_user_selfButton')
}

const currentUserStore = useCurrentUserStore()
const isTwitterLinked = computed(() =>
  currentUserStore.providerData.some((p) => p.providerId === TwitterAuthProvider.PROVIDER_ID),
)

const handleTwitterLink = async () => {
  try {
    isLoading.value = true
    await currentUserStore.linkProvider(TwitterAuthProvider.PROVIDER_ID)
    await router.push(getProfile(isNewUser))
  } catch (error) {
    console.error(error)
    // TODO error message
    notification.show('Error', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container>
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h4 font-weight-bold">{{ titleLabel }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="pre-line my-5">
                {{ descriptionLabel }}
              </p>
            </v-row>
          </v-container>

          <v-btn
            class="mb-4"
            size="large"
            color="grey-900"
            block
            :disabled="isTwitterLinked"
            :loading="isLoading"
            @click="handleTwitterLink"
          >
            {{ $t('complete.profile_registration_X') }}
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :loading="isLoading" :to="getProfile(isNewUser)">
            {{ selfButtonLabel }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
