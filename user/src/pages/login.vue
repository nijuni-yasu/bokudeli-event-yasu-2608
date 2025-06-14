<script setup lang="ts">
import { functions } from '@/firebase'
import {httpsCallable} from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import {generatePassCode} from "@/utils/generatePassCode";
import { FirebaseError } from 'firebase/app'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  linkWithCredential,
  getAdditionalUserInfo,
  type UserCredential,
  signInWithCustomToken,
  type AdditionalUserInfo
} from 'firebase/auth'
import {convertStoredUserToFirestoredUser} from "@/schemes/converter";
import {useValidators} from "@/composable/validators";
import {getCredentialWithPopup, signInByProviderService} from "@/utils/providerService";
import {useStoreUserAdditionalInfo} from "@/stores/userAdditionalInfo";
import {useStoreUserCredential} from "@/stores/userCredential";
import {useStoreFirebaseAuthError} from "@/stores/firebaseAuthError";
import {useStoreStoredUser} from "@/stores/storedUser";
import type {StoredUser} from "@/schemes/storedUser";
import {type UserStore, useUserStore} from "@/stores/user";

type CreateUserRequest = {
  user_email: string
  user_pass_code: string
}

type CreateUserResponse = {
  is_new: boolean
}

type CustomData = {
  email: string
  _tokenResponse?: {
    verifiedProvider?: string[];
  };
}

const route = useRoute()
const router = useRouter()

const { t: $t } = useI18n()

const isLoading = ref(false)
const isDisable = ref(false)

const isValid = ref(false)
const email = ref('')

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  isLoading.value = true
  isDisable.value = true
  try {
    const userEmail = email.value
    if (!userEmail) {
      throw new Error('Email is required')
    }

    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, "create_or_update_user")
    const { data } = await createOrUpdateUser({ user_email: userEmail, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: userEmail, user_pass_code: passCode })

    router.push({
      path: '/pass-code',
      query: {
        email: userEmail,
        new: Number(data.is_new),
        redirect: route.query.redirect,
      }
    })
  } catch (error) {
    console.warn("Error sending pass code:", error)
  } finally {
    isLoading.value = false
    isDisable.value = false
  }
}

const handleTwitterLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Twitter')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, "get_custom_token")
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', {snsName: 'X'}))

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
          await transitionJudge(userCredential, additionalUserInfo)
        }).catch((error) => {
          console.error(error)
          window.alert($t('login.login_fail', {snsName: 'X'}))
        });
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', {snsName: 'X'}))
    }
  }
}

const handleFacebookLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Facebook')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, "get_custom_token")
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', {snsName: 'Facebook'}))

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
          await transitionJudge(userCredential, additionalUserInfo)
        }).catch((error) => {
          console.error(error)
          window.alert($t('login.login_fail', {snsName: 'Facebook'}))
        });
      }
    } else {
      console.error({ error })
      window.alert($t('login.login_fail', {snsName: 'Facebook'}))
    }
  }
}

const handleGoogleLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Google')
    const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
    await transitionJudge(userCredential, additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/account-exists-with-different-credential') {
        let userCredential
        const customData = error?.customData as CustomData
        const verifiedProvider = customData?._tokenResponse?.verifiedProvider
        // カスタムトークンログインを行い、メールアドレスが既に存在している場合
        if (!verifiedProvider) {
          const getCustomToken = httpsCallable(functions, "get_custom_token")
          const result = await getCustomToken({ user_email: customData?.email })
          const customToken = result.data as string

          userCredential = await signInWithCustomToken(getAuth(), customToken)
        } else {
          switch (verifiedProvider[0]) {
            case 'google.com':
              userCredential = await signInByProviderService('Google')
              break
            case 'facebook.com':
              userCredential = await signInByProviderService('Facebook')
              break
            case 'twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert($t('login.login_fail', {snsName: 'Google'}))

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
          await transitionJudge(userCredential, additionalUserInfo)
        }).catch((error) => {
          console.error(error)
          window.alert($t('login.login_fail', {snsName: 'Google'}))
        });
      }

    } else {
      console.error({ error })
      window.alert($t('login.login_fail', {snsName: 'Google'}))
    }
  }
}

const transitionJudge = async (userCredential: UserCredential, additionalUserInfo: AdditionalUserInfo) => {
  const email = userCredential.user.email ?? additionalUserInfo?.profile?.email as string
  const isNewUser = additionalUserInfo?.isNewUser;

  const storedUserStore = useStoreStoredUser()

  await new Promise<void>((resolve) => {
    let unwatch: (() => void) | null = null

    unwatch = watch(
        () => storedUserStore.storedUser,
        (storedUser) => {
          if (storedUser) {
            if (unwatch) unwatch()
            resolve();
          }
        },
        { immediate: true }
    );
  });
  const storedUser = storedUserStore.storedUser as StoredUser
  const userStore = useUserStore(storedUser.userId) as UserStore

  if (isNewUser) {
    switch (additionalUserInfo.providerId) {
      case 'facebook.com':
        storedUser.userSnsFacebook = additionalUserInfo.profile?.name as string
        storedUserStore.update(storedUser)
        await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
        break
      case 'twitter.com':
        storedUser.userSnsTwitter = additionalUserInfo?.username as string
        storedUserStore.update(storedUser)
        await userStore.updateUser(convertStoredUserToFirestoredUser(storedUser))
        break
      case 'google.com':
        // TODO: userSnsGoogleの保存処理
        break
      default:
        break
    }
  }

  useStoreUserAdditionalInfo().reset()
  useStoreFirebaseAuthError().reset()

  // メールアドレスが無いか、twitter, facebookで認証が済んでいない場合はメールアドレス設定へ
  if ((email === "" || !email) || (storedUser?.verifiedAt === null && (userCredential.providerId === 'twitter.com' || userCredential.providerId === 'facebook.com'))) {
    return  router.push({
      path: '/register/email',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      }
    })
  }

  // google以外のプロバイダでverifiedAtがnullならパスコード認証を行う
  if (!storedUser?.verifiedAt && additionalUserInfo.providerId !== 'google.com') {
    const passCode = generatePassCode()

    const createOrUpdateUser = httpsCallable<CreateUserRequest, CreateUserResponse>(functions, "create_or_update_user")
    const { data } = await createOrUpdateUser({ user_email: email, user_pass_code: passCode })

    const sendPassCode = httpsCallable(functions, "send_pass_code")
    await sendPassCode({ user_email: email, user_pass_code: passCode })

    return router.push({
      path: '/pass-code',
      query: {
        email: email,
        new: Number(Number(data.is_new)),
        redirect: route.query.redirect,
      }
    })
  }

  // プロフィールが埋まっていれば、元いたページへ
  if (storedUser?.userName && storedUser?.userDescription && storedUser?.userImageUrl) {
    if (route.query.redirect) {
      return router.push(route.query.redirect as string)
    } else {
      return router.push('/')
    }
  }

  // プロフィールが埋まっていなければ、登録完了（プロフィール登録誘導）へ
  return router.push({
    path: '/register/complete',
    query: {
      new: Number(isNewUser),
      redirect: route.query.redirect,
    }
  })
}

onMounted(async () => {
  const userCredential = useStoreUserCredential().userCredential
  const additionalUserInfo = useStoreUserAdditionalInfo().additionalUserInfo
  const error = useStoreFirebaseAuthError().error
  if (userCredential !== undefined && additionalUserInfo !== null) {
    try {
      isDisable.value = true
      await transitionJudge(userCredential, additionalUserInfo)
    } catch (error) {
      console.error(error)
      isDisable.value = false
    } finally {
      isDisable.value = false
    }
  } else if (error && error.code === 'auth/account-exists-with-different-credential') {
    const tokenResponse = error.customData?._tokenResponse as { providerId: string }
    const providerId = tokenResponse.providerId

    let providerService: 'Facebook' | 'Google' | 'Twitter' | null = null
    let credential = null
    switch (providerId) {
      case FacebookAuthProvider.PROVIDER_ID:
        providerService = 'Facebook'
        credential = FacebookAuthProvider.credentialFromError(error)
        break
      case GoogleAuthProvider.PROVIDER_ID:
        providerService = 'Google'
        credential = GoogleAuthProvider.credentialFromError(error)
        break
      case TwitterAuthProvider.PROVIDER_ID:
        providerService = 'Twitter'
        credential = TwitterAuthProvider.credentialFromError(error)
        break
    }
    console.error({ error, credential })


    let userCredential
    const customData = error?.customData as CustomData
    const verifiedProvider = customData?._tokenResponse?.verifiedProvider
    // カスタムトークンログインを行い、メールアドレスが既に存在している場合
    if (!verifiedProvider) {
      const getCustomToken = httpsCallable(functions, "get_custom_token")
      const result = await getCustomToken({ user_email: customData?.email })
      const customToken = result.data as string

      userCredential = await signInWithCustomToken(getAuth(), customToken)
    } else {
      switch (verifiedProvider[0]) {
        case 'google.com':
          userCredential = await getCredentialWithPopup('Google')
          break
        case 'facebook.com':
          userCredential = await getCredentialWithPopup('Facebook')
          break
        case 'twitter.com':
          userCredential = await getCredentialWithPopup('Twitter')
          break
      }
    }

    if (!userCredential || !credential) return window.alert($t('login.login_fail', {snsName: providerService}))

    await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
      const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
      await transitionJudge(userCredential, additionalUserInfo)
    }).catch((error) => {
      console.error(error)
      window.alert($t('login.login_fail', {snsName: providerService}))
    });
  }
})

</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container class="mb-2">
            <v-row justify="center" >
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <div class="my-3 text-h3 font-weight-bold">{{ $t('login.welcome') }}</div>
            </v-row>
            <v-row justify="center">
              <p>{{ $t('login.please_login_or_register_below') }}</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class="mb-4 pa-0">
              <label class="field-label" style="font-size: 12px; font-weight: bold;">{{ $t('login.email') }}</label>
              <v-text-field placeholder="example@example.com" v-model="email" :rules="[requiredValidator, emailValidator]"/>
            </v-container>

            <v-btn class="mb-12" size="large" color="grey-900" block :disabled="!isValid" :loading="isLoading" type="submit">
              {{ $t('login.continue_email') }}
            </v-btn>
          </v-form>

          <v-btn class="mb-4" size="large" color="grey-900" block :disabled="isDisable" @click="handleTwitterLogin">
            {{ $t('login.sns_login', {snsName: 'X'}) }}
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :disabled="isDisable" @click="handleFacebookLogin">
            {{ $t('login.sns_login', {snsName: 'Facebook'}) }}
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :disabled="isDisable" @click="handleGoogleLogin">
            {{ $t('login.sns_login', {snsName: 'Google'}) }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>