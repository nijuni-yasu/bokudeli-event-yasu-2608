<script setup lang="ts">
import logo from "@/assets/images/shokujii/shokujii_logo_wide.png";
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  getAdditionalUserInfo,
  reauthenticateWithPopup,
  type User
} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import {FirestoredUser, type StoredUser} from "@/schemes/storedUser"
import {convertFirestoredUserToStoredUser} from "@/schemes/converter";
import axios from 'axios'


type ProfileLink = {
  path: string,
  query: {
    new: number,
    redirect: string,
  }
}

const storedUserStore = useStoreStoredUser()
const { storedUser } = storeToRefs(storedUserStore)
const user = computed(() => {
  const userId = storedUser.value?.userId
  return userId == null ? null : (useUserStore(userId) as UserStore).user
})
const currentUser: User | null = getAuth().currentUser

const route = useRoute()
const router = useRouter()

const titleLabel = ref('')
const descriptionLabel = ref('')
const selfButtonLabel = ref('')
const profileLink: ProfileLink = {
  path: '/u/profile',
  query: {
    new: Number(route.query.new),
    redirect: route.query.redirect as string,
  }
}

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

if (isNew.value === 1) {
  titleLabel.value = 'アカウント登録完了'
  descriptionLabel.value = 'shokujiiのアカウントの登録が完了しました 🎉\nSNSアカウント連携して、プロフィールを登録しましょう。'
  selfButtonLabel.value = '自分でプロフィールを登録する'
} else {
  titleLabel.value = 'プロフィール登録'
  descriptionLabel.value = 'プロフィールが登録されていません。\nSNSアカウントと連携して、プロフィール登録を完了させよう👍'
  selfButtonLabel.value = '自分でプロフィールを入力する'
}

const linkByProviderService = async (user: User , providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
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
    return await linkWithPopup(user, provider);
  } else {
    return await linkWithRedirect(user, provider)
  }
}

const handleTwitterLink = async () => {
  try {
    if (!currentUser) throw new Error('currentUser is null')
    const userCredential = await linkByProviderService(currentUser, 'Twitter')
    const additionalUserInfo = getAdditionalUserInfo(userCredential)

    if (additionalUserInfo === null) return
    const firestoredUser = user.value as FirestoredUser
    firestoredUser.user_name = additionalUserInfo.profile?.name as string | ""
    firestoredUser.user_description = additionalUserInfo.profile?.description as string | null
    firestoredUser.user_url_path = additionalUserInfo.username as string | null
    firestoredUser.user_sns_twitter = additionalUserInfo.username as string | null
    const userStore = useUserStore(firestoredUser.user_id) as UserStore
    await userStore.updateUser(firestoredUser)

    const photoUrl = additionalUserInfo.profile?.profile_image_url_https as string
    const splitPhotoURL = photoUrl.split('_') as string[]
    const photoURL = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1];

    // blobに変換
    const response = await axios.get(photoURL, { responseType: "blob" });
    const blob = response.data;

    // 保存
    await userStore.uploadUserImage(blob)

    storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser))

    router.push(profileLink)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (!currentUser) throw new Error('currentUser is null')

      const provider = new TwitterAuthProvider()
      await reauthenticateWithPopup(currentUser, provider).then(async (result) => {
        const additionalUserInfo = getAdditionalUserInfo(result);

        if (!additionalUserInfo) return
        const firestoredUser = user.value as FirestoredUser
        firestoredUser.user_name = additionalUserInfo.profile?.name as string | ""
        firestoredUser.user_description = additionalUserInfo.profile?.description as string | null
        firestoredUser.user_url_path = additionalUserInfo.username as string | null
        firestoredUser.user_sns_twitter = additionalUserInfo.username as string | null

        storedUserStore.update(convertFirestoredUserToStoredUser(firestoredUser))

        const userStore = useUserStore(firestoredUser.user_id) as UserStore
        await userStore.updateUser(firestoredUser)

        const photoUrl = additionalUserInfo.profile?.profile_image_url_https as string
        const splitPhotoURL = photoUrl.split('_') as string[]
        const photoURL = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1];

        // blobに変換
        const response = await axios.get(photoURL, { responseType: "blob" });
        const blob = response.data;

        // 画像保存
        await userStore.uploadUserImage(blob)
        router.push(profileLink)
      })
      .catch((error) => {
        console.error("再認証時エラー", error);
      });
    } else {
      console.error({ error })
    }
  }
}

const handleFacebookLink = async () => {
  try {
    if (!currentUser) throw new Error('currentUser is null')
    console.log('currentUser', currentUser)
    const userCredential = await linkByProviderService(currentUser, 'Facebook')
    const additionalUserInfo = getAdditionalUserInfo(userCredential)

    if (additionalUserInfo === null) return
    console.log('additionalUserInfo', additionalUserInfo)
    // TODO: 取得したパラメタをUserへ保存
    // そもそも名前と画像位しか情報が取得出来ない為、要相談
    router.push(profileLink)
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/credential-already-in-use') router.push(profileLink)
      if (!currentUser) throw new Error('currentUser is null')

      const provider = new TwitterAuthProvider()
      await reauthenticateWithPopup(currentUser, provider).then(async (result) => {
        const additionalUserInfo = getAdditionalUserInfo(result);

        if (!additionalUserInfo) return
        // TODO: 取得したパラメタをUserへ保存
      })

      const credential = FacebookAuthProvider.credentialFromError(error)
      console.error({ error, credential })
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
              <h1 class="my-3 text-h3 font-weight-bold">{{ titleLabel }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="pre-line">
                {{ descriptionLabel }}
              </p>
            </v-row>
          </v-container>

          <v-btn class="mb-4" size="large" color="grey-900" block @click="handleTwitterLink">
            X と連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block @click="handleFacebookLink">
            Facebookと連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :to="profileLink">
            {{ selfButtonLabel }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">

</style>