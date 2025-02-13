<script setup lang="ts">
import logo from "@/assets/images/shokujii/shokujii_logo.png";
import {
  getAuth,
  TwitterAuthProvider,
  getAdditionalUserInfo,
  type User,
  type AdditionalUserInfo
} from "firebase/auth";
import {FirebaseError} from "firebase/app";
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import {FirestoredUser} from "@/schemes/storedUser"
import {convertFirestoredUserToStoredUser} from "@/schemes/converter";
import axios from 'axios'
import {linkByProviderService, reauthenticateByProviderService} from "@/utils/providerService";
import {useStoreUserAdditionalInfo} from "@/stores/userAdditionalInfo";

type ProfileLink = {
  path: string,
  query: {
    new: number,
    redirect: string,
  }
}

const auth = getAuth()
const currentUser = auth.currentUser;

const linkedProviderData = ref<string[]>([]);

const updateProviderData = (user: User | null) => {
  linkedProviderData.value = user
      ? user.providerData.map((info) => info.providerId)
      : [];
};

// 初期化（現在のユーザー情報を取得）
if (currentUser) {
  updateProviderData(currentUser);
}

const route = useRoute()
const router = useRouter()

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

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

const isLoading = ref(false)

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

const handleTwitterLink = async () => {
  try {
    isLoading.value = true
    if (!currentUser) throw new Error('currentUser is null')
    let userCredential
    if (linkedProviderData.value.includes('twitter.com')) {
      userCredential = await reauthenticateByProviderService(currentUser, 'Twitter')
    } else {
      userCredential = await linkByProviderService(currentUser, 'Twitter')
    }
    const additionalUserInfo = getAdditionalUserInfo(userCredential)

    if (additionalUserInfo === null) return

    await setTwitterProfile(additionalUserInfo)
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })

      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', {snsName: 'X'}), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const additionalUserInfo = useStoreUserAdditionalInfo().additionalUserInfo
  if (additionalUserInfo === null) return

  try {
    isLoading.value = true
    await setTwitterProfile(additionalUserInfo)
  } catch (error) {
    console.error(error)
    isLoading.value = false
  } finally {
    isLoading.value = false
  }
})

const setTwitterProfile = async (additionalUserInfo: AdditionalUserInfo) => {
  const storedUserStore = useStoreStoredUser()
  const { storedUser } = storeToRefs(storedUserStore)
  const userId = storedUser.value?.userId
  if (userId) {
    const userStore = useUserStore(userId) as UserStore
    await new Promise<void>((resolve) => {
      let unwatch: (() => void) | null = null

      unwatch = watch(
          () => userStore.user,
          (newUser) => {
            if (newUser) {
              if (unwatch) unwatch()
              resolve();
            }
          },
          { immediate: true }
      );
    });

    const firestoredUser = userStore.user as FirestoredUser
    firestoredUser.user_name = additionalUserInfo.profile?.name as string | ""
    firestoredUser.user_description = additionalUserInfo.profile?.description as string | null
    firestoredUser.user_account = additionalUserInfo.username as string | null
    firestoredUser.user_sns_twitter = additionalUserInfo.username as string | null
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
    // 明示的に削除
    useStoreUserAdditionalInfo().reset()

    router.push(profileLink)
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
            X と連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :loading="isLoading" :to="profileLink">
            {{ selfButtonLabel }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>