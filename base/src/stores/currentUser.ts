import {
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  signInWithCustomToken,
  TwitterAuthProvider,
  unlink,
  Unsubscribe,
  updateEmail,
  User,
} from 'firebase/auth'
import {
  collection,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  getDocs,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, markRaw, ref, toRaw, watch } from 'vue'
import { User as ShokujiiUser } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'
import { db } from '@shokujii/base/firebase.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { getBlobIfNecessary } from '@shokujii/base/utils/user'
import { linkByProviderService, ProviderIdType } from '@shokujii/base/utils/providerService'
import { generatePassCode } from '@shokujii/base/utils/generatePassCode.js'

import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import { getCustomToken, verifyPassCode } from '@shokujii/base/apis/user'
import { FirebaseError } from 'firebase/app'

const converterUserPersonalInformation: FirestoreDataConverter<UserPersonalInformation> = {
  toFirestore(userPersonalInformation: UserPersonalInformation): DocumentData {
    return userPersonalInformation.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserPersonalInformation {
    const data = snapshot.data(options)
    return new UserPersonalInformation(snapshot.id, data)
  },
}

export const useCurrentUserStore = defineStore('currentUser', () => {
  const firebaseUser = ref(getAuth().currentUser)
  getAuth().onAuthStateChanged(async (user) => {
    if (user != null) {
      const userStore = useUserStore(user.uid)
      let currentUser: ShokujiiUser | null = await new Promise((resolve) =>
        watch(
          () => [userStore.user, userStore.exists],
          () => {
            if (userStore.user != null) {
              resolve(userStore.user)
            } else if (userStore.exists === false) {
              resolve(null)
            }
          },
          { immediate: true },
        ),
      )
      const actualUser = (await getRedirectResult(getAuth()))?.user ?? user
      if (currentUser == null) {
        currentUser = new ShokujiiUser(actualUser.uid, {
          user_name: actualUser.displayName ?? undefined,
          user_image_url: actualUser.photoURL ?? undefined,
        })
        await Promise.all([
          userStore.updateUser(currentUser),
          updatePersonalInformation(
            new UserPersonalInformation(actualUser.uid, { user_email: actualUser.email ?? undefined }),
          ),
        ])
      }
      // ログインに影響が出ないよう、非同期で画像を取得する
      getBlobIfNecessary(actualUser.providerData, userStore.user!).then(async (blob) => {
        if (blob != null) {
          await uploadUserImage(blob)
        }
      })
      firebaseUser.value = markRaw(actualUser)
    } else {
      reset()
      firebaseUser.value = null
    }
  })

  const user = computed(() => {
    if (firebaseUser.value === null) {
      return null
    }
    const userStore = useUserStore(firebaseUser.value.uid)
    return userStore.user
  })

  let unsubscribePersonalInformation: Unsubscribe | null = null
  const subscribePersonalInformation = (personalInformationRef: DocumentReference<UserPersonalInformation>) => {
    if (unsubscribePersonalInformation == null) {
      unsubscribePersonalInformation = onSnapshot(personalInformationRef, (userSnapshot) => {
        personalInformation.value = userSnapshot.data() ?? null
      })
    }
  }
  const personalInformation = ref<UserPersonalInformation | null>(null)

  const reset = () => {
    unsubscribePersonalInformation?.()
    unsubscribePersonalInformation = null
    personalInformation.value = null
  }

  watch(
    firebaseUser,
    (newFirebaseUser) => {
      reset()
      if (newFirebaseUser != null) {
        const personalInformationRef = doc(db, 'users_personal_information', newFirebaseUser.uid).withConverter(
          converterUserPersonalInformation,
        )
        subscribePersonalInformation(personalInformationRef)
      }
    },
    { immediate: true },
  )

  const updateUser = async (user: ShokujiiUser) => {
    await useUserStore(user.user_id).updateUser(user)
  }

  const updatePersonalInformation = async (personalInformation: UserPersonalInformation) => {
    if (firebaseUser.value == null) return
    const personalInformationRef = doc(db, 'users_personal_information', personalInformation.id).withConverter(
      converterUserPersonalInformation,
    )
    await setDoc(personalInformationRef, personalInformation, { merge: true })
  }

  const uploadUserImage = async (file: File | Blob) => {
    if (firebaseUser.value == null) {
      throw new Error('Not logged in')
    }
    const userStore = useUserStore(firebaseUser.value.uid)
    await userStore.uploadUserImage(file)
  }

  /**
   * メールアドレス変更依頼を `user_email_pending` に保存し、pass code を新しいメールアドレスに送る
   * @param newUserEmail
   */
  const requestEmailChange = async (newUserEmail: string) => {
    // メールアドレスが既に存在しているかチェック、存在していれば Exception
    const existPersonalInformation = await getDocs(
      query(collection(db, 'users_personal_information'), where('user_email', '==', newUserEmail)),
    )
    if (!existPersonalInformation.empty) {
      throw new Error('already-exists')
    }

    // TODO Move to functions
    const currentUser = user.value
    const currentUserPersonalInformation = personalInformation.value
    if (currentUser == null || currentUserPersonalInformation == null) {
      throw new Error('User not logged in')
    }
    const passCode = generatePassCode()
    currentUser.user_pass_code = passCode
    currentUserPersonalInformation.user_email_pending = newUserEmail
    await Promise.all([
      updateUser(toRaw(currentUser)),
      updatePersonalInformation(toRaw(currentUserPersonalInformation)),
    ])

    // @shokujii/base/api に移動すべきだが、そもそも send_pass_code 自体は消す方向なので一時的に
    const sendPassCode = httpsCallable(functions, 'send_pass_code')
    await sendPassCode({ user_email: newUserEmail, user_pass_code: passCode })
  }

  const confirmEmailChange = async (passCode: string) => {
    const currentUser = user.value
    const currentUserPersonalInformation = personalInformation.value
    const currentFirebaseUser = firebaseUser.value
    if (currentUser == null || currentUserPersonalInformation == null || currentFirebaseUser == null) {
      throw new Error('User not logged in')
    }
    const newEmail = currentUserPersonalInformation.user_email_pending
    if (newEmail == null) {
      throw new Error('No request')
    }

    const result = await verifyPassCode({
      user_email_pending: currentUserPersonalInformation.user_email_pending,
      user_pass_code: passCode,
    })
    if (!result.data) {
      throw new Error('')
    }

    const _updateEmail = async (user: User) => {
      try {
        await updateEmail(user, newEmail)
      } catch (error: unknown) {
        if (error instanceof FirebaseError && error.code === 'auth/requires-recent-login') {
          const result = await getCustomToken({ user_email: user.email! })
          const customToken = result.data
          const userCredential = await signInWithCustomToken(getAuth(), customToken)
          await _updateEmail(userCredential.user)
        } else {
          throw error
        }
      }
    }
    await _updateEmail(toRaw(currentFirebaseUser))
    personalInformation.value!.user_email = newEmail
    updatePersonalInformation(toRaw(personalInformation.value!))
  }

  const linkProvider = async (providerId: ProviderIdType) => {
    const currentUser = user.value
    const currentUserPersonalInformation = personalInformation.value
    const currentFirebaseUser = firebaseUser.value
    if (currentUser == null || currentUserPersonalInformation == null || currentFirebaseUser == null) {
      throw new Error('Not logged in')
    }
    const userCredential = await linkByProviderService(currentFirebaseUser, providerId)
    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo != null) {
      switch (additionalUserInfo.providerId) {
        case 'facebook.com':
          currentUser.user_sns_facebook_name =
            currentUser.user_sns_facebook_name || (additionalUserInfo.profile?.name as string)
          await updateUser(currentUser)
          break
        case 'twitter.com':
          currentUser.user_sns_twitter = additionalUserInfo?.username as string
          var twitterCredential = TwitterAuthProvider.credentialFromResult(userCredential)
          if (twitterCredential?.accessToken && twitterCredential.secret) {
            currentUserPersonalInformation.user_sns_twitter_access_token =
              currentUserPersonalInformation.user_sns_twitter_access_token || twitterCredential.accessToken
            currentUserPersonalInformation.user_sns_twitter_secret =
              currentUserPersonalInformation.user_sns_twitter_secret || twitterCredential.secret
            if (
              currentUserPersonalInformation.user_sns_twitter_access_token &&
              currentUserPersonalInformation.user_sns_twitter_secret
            ) {
              await updatePersonalInformation(currentUserPersonalInformation)
            }
          }
          break
        case 'google.com':
          currentUserPersonalInformation.user_sns_google = additionalUserInfo?.profile?.email as string
          await updatePersonalInformation(toRaw(currentUserPersonalInformation))
          break
      }
    }
  }

  const unlinkProvider = async (providerId: ProviderIdType) => {
    const currentUser = user.value
    const currentUserPersonalInformation = personalInformation.value
    const currentFirebaseUser = firebaseUser.value
    if (currentUser == null || currentUserPersonalInformation == null || currentFirebaseUser == null) {
      throw new Error('Not logged in')
    }
    // 各プロバイダーは連携解除時に関連する値を削除する
    switch (providerId) {
      case 'google.com':
        currentUserPersonalInformation.user_sns_google = ''
        break
      case 'facebook.com':
        currentUser.user_sns_facebook_name = ''
        break
      case 'twitter.com':
        currentUser.user_sns_twitter = ''
        currentUserPersonalInformation.user_sns_twitter_access_token = ''
        currentUserPersonalInformation.user_sns_twitter_secret = ''
        break
    }

    await Promise.all([
      unlink(toRaw(currentFirebaseUser), providerId),
      updateUser(toRaw(currentUser)),
      updatePersonalInformation(toRaw(currentUserPersonalInformation)),
    ])
  }

  const signOut = async () => {
    await getAuth().signOut()
    // reset() は onAuthStateChanged のコールバックで呼ばれるが、念のためここでも呼んでおく
    reset()
  }

  return {
    firebaseUser,
    user,
    personalInformation,
    updateUser,
    updatePersonalInformation,
    uploadUserImage,
    requestEmailChange,
    confirmEmailChange,
    linkProvider,
    unlinkProvider,
    signOut,
  }
})
