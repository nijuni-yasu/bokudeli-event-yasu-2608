<script setup lang="ts">
import { functions } from '@/firebase'
import {httpsCallable} from 'firebase/functions'
import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'
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
  getAdditionalUserInfo
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import {convertDocumentDataToStoredUser} from "@/schemes/converter";

type CreateUserRequest = {
  user_email: string
  user_pass_code: string
}

type CreateUserResponse = {
  is_new: boolean
}

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)

const isValid = ref(false)
const email = ref('')

// TODO: ソーシャルログインで新規アカウントか既存アカウントかの判定方法を検討（）

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

const loginProvider = 'google' as 'facebook' | 'google'

const isEnableLinkWithCredential = false

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
    return  await signInWithPopup(getAuth(), provider)
  } else {
    return await signInWithRedirect(getAuth(), provider)
  }
}

const getCredentialWithPopup = async (providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      provider.addScope('email')
      provider.setCustomParameters({
        display: 'popup',
      })
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

  return await signInWithPopup(getAuth(), provider)
}

const handleTwitterLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Twitter')
    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    const isNewUser = additionalUserInfo?.isNewUser;

    const docRef = doc(db, 'users', userCredential.user.uid)
    const docSnap = await getDoc(docRef)
    const storedUser = convertDocumentDataToStoredUser(docSnap.data())

    if (!storedUser.userEmail) {
      router.push({
        path: '/register/email',
        query: {
          new: Number(isNewUser),
          redirect: route.query.redirect,
          type: 'Twitter'
        }
      })
    }

    if (storedUser.userName && storedUser.userDescription && storedUser.userImageUrl) {
      if (route.query.redirect) {
        return router.push(route.query.redirect as string)
      } else {
        return router.push('/')
      }
    }

    router.push({
      path: '/u/profile',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      }
    })
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
  }
}

const handleFacebookLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Facebook')
    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    const isNewUser = additionalUserInfo?.isNewUser;

    const docRef = doc(db, 'users', userCredential.user.uid)
    const docSnap = await getDoc(docRef)
    const storedUser = convertDocumentDataToStoredUser(docSnap.data())

    if (!storedUser.userEmail) {
      router.push({
        path: '/register/email',
        query: {
          new: Number(isNewUser),
          redirect: route.query.redirect,
          type: 'Facebook'
        }
      })
    }

    if (storedUser.userName && storedUser.userDescription && storedUser.userImageUrl) {
      if (route.query.redirect) {
        router.push(route.query.redirect as string)
      } else {
        router.push('/')
      }
    }

    router.push({
      path: '/u/profile',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      }
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error('error, credential', error, credential)
      console.error('{ error, credential }', { error, credential })
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
  }
}

const handleGoogleLogin = async () => {
  try {
    const userCredential = await signInByProviderService('Google')
    const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;

    const docRef = doc(db, 'users', userCredential.user.uid)
    const docSnap = await getDoc(docRef)
    const storedUser = convertDocumentDataToStoredUser(docSnap.data())

    if (storedUser.userName && storedUser.userDescription && storedUser.userImageUrl) {
      if (route.query.redirect) {
        return router.push(route.query.redirect as string)
      } else {
        return router.push('/')
      }
    }

    router.push({
      path: '/register/complete',
      query: {
        new: Number(isNewUser),
        redirect: route.query.redirect,
      }
    })
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
  }
}

</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col md="5">
        <v-sheet class="rounded-lg py-14 px-12">
          <v-container>
            <v-row justify="center" >
              <v-img max-height="150" max-width="300" :src="logo"></v-img>
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
              <v-text-field placeholder="example@example.com" v-model="email"/>
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