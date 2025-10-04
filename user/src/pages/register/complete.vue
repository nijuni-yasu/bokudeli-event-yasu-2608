<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { TwitterAuthProvider, getAdditionalUserInfo } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { linkByProviderService, reauthenticateByProviderService } from '@shokujii/base/utils/providerService.js'
import { getProfile } from '@/router/utils'
import { useNotification } from '@shokujii/base/composable/notification'

const route = useRoute()
const router = useRouter()

const notification = useNotification()
const { t: $t } = useI18n()

const titleLabel = ref('')
const descriptionLabel = ref('')
const selfButtonLabel = ref('')
const profileLink = {
  path: getProfile(),
  query: {
    new: Number(route.query.new),
    redirect: route.query.redirect as string,
  },
}

const isLoading = ref(false)

const isNew = route.query.isnew === undefined || (route.query.isnew as string) === 'false' ? false : true

if (isNew) {
  titleLabel.value = $t('complete.new_user_title')
  descriptionLabel.value = $t('complete.new_user_description')
  selfButtonLabel.value = $t('complete.new_user_selfButton')
} else {
  titleLabel.value = $t('complete.exists_user_title')
  descriptionLabel.value = $t('complete.exists_user_description')
  selfButtonLabel.value = $t('complete.exists_user_selfButton')
}

const handleTwitterLink = async () => {
  try {
    isLoading.value = true
    const currentUserStore = useCurrentUserStore()
    const user = currentUserStore.user
    const firebaseUser = currentUserStore.firebaseUser
    if (user == null || firebaseUser == null) {
      throw new Error('currentUser is null')
    }
    let userCredential
    if (firebaseUser.providerData.some((pd) => pd.providerId === 'twitter.com')) {
      userCredential = await reauthenticateByProviderService(firebaseUser, 'twitter.com')
    } else {
      userCredential = await linkByProviderService(firebaseUser, 'twitter.com')
    }
    const additionalUserInfo = getAdditionalUserInfo(userCredential)

    if (additionalUserInfo === null) {
      // TODO notification
      return
    }

    user.user_name = (additionalUserInfo.profile?.name as string) ?? ''
    user.user_description = (additionalUserInfo.profile?.description as string) ?? ''
    user.user_sns_twitter = (additionalUserInfo.username as string) ?? ''
    await currentUserStore.updateUser(user)
    await router.push(profileLink)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/credential-already-in-use') {
        notification.show($t('user.exists_credential', { snsName: 'X（旧Twitter）' }), 'error')
      } else {
        // TODO error message
        notification.show('Error', 'error')
      }
    } else if (error) {
      console.error({ error })
    }
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
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">{{ titleLabel }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="pre-line">
                {{ descriptionLabel }}
              </p>
            </v-row>
          </v-container>

          <v-btn class="mb-4" size="large" color="grey-900" block :loading="isLoading" @click="handleTwitterLink">
            {{ $t('complete.profile_registration_X') }}
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :loading="isLoading" :to="profileLink">
            {{ selfButtonLabel }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
