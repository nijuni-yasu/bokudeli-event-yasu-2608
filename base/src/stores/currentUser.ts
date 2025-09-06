import { FirebaseError } from 'firebase/app'
import {
  AdditionalUserInfo,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  Unsubscribe,
  UserCredential,
} from 'firebase/auth'
import {
  doc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  onSnapshot,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref, toRaw, watch } from 'vue'
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'
import { db } from '@shokujii/base/firebase.js'
import { useUserStore } from '@shokujii/base/stores/user.js'

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
    firebaseUser.value = user
    userCredential.value = await getRedirectResult(getAuth())
  })

  // 本来、store で持つべきものではないが、ログイン処理が UI に依存しているため、仕方なくここで持つ
  const lastFirebaseError = ref<FirebaseError | null>(null)
  const setLastFirebaseError = (error: FirebaseError | null) => {
    lastFirebaseError.value = error
  }

  // const credential = ref<OAuthCredential | null>(null)
  const userCredential = ref<UserCredential | null>(null)
  const additionalUserInfo = computed<AdditionalUserInfo | null>(() => {
    if (userCredential.value == null) {
      return null
    }
    return getAdditionalUserInfo(toRaw(userCredential.value))
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
    // credential.value = null
    userCredential.value = null
    lastFirebaseError.value = null
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

  const updateUser = async (user: User) => {
    await useUserStore(user.user_id).updateUser(user)
  }

  const updatePersonalInformation = async (personalInformation: UserPersonalInformation) => {
    if (firebaseUser.value == null) return
    const personalInformationRef = doc(db, 'users_personal_information', personalInformation.id).withConverter(
      converterUserPersonalInformation,
    )
    await setDoc(personalInformationRef, personalInformation)
  }

  const uploadUserImage = async (file: File | Blob) => {
    if (firebaseUser.value == null) {
      throw new Error('Not logged in')
    }
    const userStore = useUserStore(firebaseUser.value.uid)
    await userStore.uploadUserImage(file)
  }

  // 本来、ログイン処理なども store で行うべきだが、現状の実装では処理を分離するのが難しいため、 credential の更新のみを行う
  // TODO 修正
  // const updateCredentialFromUserCredential = async (redirectResult: UserCredential) => {
  //   try {
  //     switch (redirectResult.providerId) {
  //       case FacebookAuthProvider.PROVIDER_ID:
  //         credential.value = FacebookAuthProvider.credentialFromResult(redirectResult)
  //         break
  //       case GoogleAuthProvider.PROVIDER_ID:
  //         credential.value = GoogleAuthProvider.credentialFromResult(redirectResult)
  //         break
  //       case TwitterAuthProvider.PROVIDER_ID:
  //         credential.value = TwitterAuthProvider.credentialFromResult(redirectResult)
  //         break
  //       default:
  //         console.error('Unknown providerId:', redirectResult.providerId)
  //         return
  //     }
  //   } catch (error) {
  //     console.error('Error fetching redirect result:', error)
  //   }
  // }

  const signOut = async () => {
    await getAuth().signOut()
    // reset() は onAuthStateChanged のコールバックで呼ばれるが、念のためここでも呼んでおく
    reset()
  }

  return {
    firebaseUser,
    user,
    personalInformation,
    // credential,
    userCredential,
    additionalUserInfo,
    lastFirebaseError,
    updateUser,
    updatePersonalInformation,
    uploadUserImage,
    // updateCredentialFromUserCredential,
    signOut,
    setLastFirebaseError,
  }
})
