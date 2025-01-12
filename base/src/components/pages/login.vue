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
  signInWithRedirect,
  signInWithPopup,
  linkWithCredential,
  getAdditionalUserInfo,
  type UserCredential,
  signInWithCustomToken,
  type AdditionalUserInfo
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import {convertDocumentDataToStoredUser} from "@/schemes/converter";
import {useValidators} from "@/composable/validators";

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

const isLoading = ref(false)

const isValid = ref(false)
const email = ref('')

const { requiredValidator, emailValidator } = useValidators()

const submit = async () => {
  isLoading.value = true
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
  }
}

const signInByProviderService = async (providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

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
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  if (import.meta.env.DEV) {
    return await signInWithPopup(getAuth(), provider)
  } else {
    return await signInWithRedirect(getAuth(), provider)
  }
}

const handleTwitterLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Twitter')
    await transitionJudge(userCredential)
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
            case 'Twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert('Xログインできませんでした')

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          await transitionJudge(userCredential)
        }).catch((error) => {
          console.error(error)
          window.alert('Xログインできませんでした')
        });
      }
    } else {
      console.error({ error })
      window.alert('Xログインできませんでした')
    }
  }
}

const handleFacebookLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Facebook')
    await transitionJudge(userCredential)
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
            case 'Twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert('Facebookログインできませんでした')

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          await transitionJudge(userCredential)
        }).catch((error) => {
          console.error(error)
          window.alert('Facebookログインできませんでした')
        });
      }
    } else {
      console.error({ error })
      window.alert('Facebookログインできませんでした')
    }
  }
}

const handleGoogleLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Google')
    await transitionJudge(userCredential)
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
            case 'Twitter.com':
              userCredential = await signInByProviderService('Twitter')
              break
          }
        }

        if (!userCredential || !credential) return window.alert('Googleログインできませんでした')

        await linkWithCredential(userCredential.user, credential).then(async (userCredential) => {
          await transitionJudge(userCredential)
        }).catch((error) => {
          console.error(error)
          window.alert('Googleログインできませんでした')
        });
      }

    } else {
      console.error({ error })
    }
  }
}

const transitionJudge = async (userCredential: UserCredential) => {
  const additionalUserInfo = getAdditionalUserInfo(userCredential) as AdditionalUserInfo
  const email = userCredential.user.email ?? additionalUserInfo?.profile?.email as string
  const isNewUser = additionalUserInfo?.isNewUser;

  const docRef = doc(db, 'users', userCredential.user.uid)
  const docSnap = await getDoc(docRef)
  const storedUser = convertDocumentDataToStoredUser(docSnap.data())

  // メールアドレスが無ければ、メールアドレス設定へ
  if (email === "" || !email) {
    return  router.push({
      path: '/register/email',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      }
    })
  }

  // google以外のプロバイダでverifiedAtがnullならパスコード認証を行う
  if (!storedUser.verifiedAt && additionalUserInfo.providerId !== 'google.com') {
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
  if (storedUser.userName && storedUser.userDescription && storedUser.userImageUrl) {
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

</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col md="5">
        <v-sheet class="rounded-lg py-14 px-12">
          <v-container>
            <v-row justify="center" >
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">shokujiへようこそ</h1>
            </v-row>
            <v-row justify="center">
              <p>以下からログインまたは新規登録してください。</p>
            </v-row>
          </v-container>

          <v-form v-model="isValid" @submit.prevent="submit">
            <v-container class=" mb-4">
              <label class="field-label" style="font-size: 12px; font-weight: bold;">メールアドレス</label>
              <v-text-field placeholder="example@example.com" v-model="email" :rules="[requiredValidator, emailValidator]"/>
            </v-container>

            <v-btn class="mb-10" size="large" color="grey-900" block :disabled="!isValid" :loading="isLoading" type="submit">
              メールアドレスで続ける
            </v-btn>
          </v-form>

          <v-btn class="mb-4" size="large" color="grey-900" block @click="handleTwitterLogin">
            Xでログイン
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block @click="handleFacebookLogin">
            Facebookでログイン
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block @click="handleGoogleLogin">
            Googleでログイン
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">


</style>