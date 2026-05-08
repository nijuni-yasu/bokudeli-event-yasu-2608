import { getAuth, signInWithCustomToken, unlink, Unsubscribe, UserInfo } from 'firebase/auth'
import {
  collectionGroup,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, markRaw, ref, toRaw, watch } from 'vue'
import { User as ShokujiiUser } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'
import {
  requestEmailChange as _requestEmailChange,
  confirmEmailChange as _confirmEmailChange,
} from '@shokujii/base/apis/user'
import { db } from '@shokujii/base/firebase.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { BokudeliEvent, useEventStore } from '@shokujii/base/stores/event.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import {
  linkByProviderService,
  ProviderIdType,
  reauthenticateByProviderService,
  updateProfileFromProviders,
} from '@shokujii/base/utils/providerService'

const converterUserPersonalInformation: FirestoreDataConverter<UserPersonalInformation> = {
  toFirestore(userPersonalInformation: UserPersonalInformation): DocumentData {
    return userPersonalInformation.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserPersonalInformation {
    const data = snapshot.data(options)
    return new UserPersonalInformation(snapshot.id, data)
  },
}

export type CartItem = {
  orders: EventMemberOrder[]
  event: BokudeliEvent
}

const memberOrderConverter: FirestoreDataConverter<EventMemberOrder> = {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberOrder {
    const data = snapshot.data(options)
    return new EventMemberOrder(snapshot.id, data)
  },
}

export const useCurrentUserStore = defineStore('currentUser', () => {
  // firebaseUser を直接外に出すのは良くないので、将来的にはこれを廃止する
  const firebaseUser = ref(getAuth().currentUser)
  const providerData = ref<UserInfo[]>([])
  getAuth().onAuthStateChanged(async (user) => {
    if (user != null) {
      firebaseUser.value = markRaw(user)
      providerData.value = user.providerData
    } else {
      reset()
      firebaseUser.value = null
      providerData.value = []
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

  const _cart = ref<CartItem[] | null>(null)
  const cart = computed(() => {
    subscribeOrders()
    return _cart.value
  })
  let unsubscribeOrders: Unsubscribe | null = null
  const subscribeOrders = () => {
    const uid = getAuth().currentUser?.uid
    if (uid == null) {
      return
    }
    if (unsubscribeOrders == null) {
      const q = query(
        collectionGroup(db, 'member_orders'),
        where('user_id', '==', uid),
        where('status', '==', 'in_cart'),
        orderBy('updated_at', 'desc'),
      ).withConverter(memberOrderConverter)
      unsubscribeOrders = onSnapshot(q, async (snapshots) => {
        const cartOrders = snapshots.docs.map((doc) => doc.data())

        const grouped = new Map<string, EventMemberOrder[]>()
        for (const order of cartOrders) {
          const key = order.event_id
          const existing = grouped.get(key)
          if (existing) {
            existing.push(order)
          } else {
            grouped.set(key, [order])
          }
        }

        _cart.value = await Promise.all(
          Array.from(grouped.entries()).map(async ([eventId, orders]) => {
            const eventStore = useEventStore(eventId)
            const event = await eventStore.getLoadedEvent()
            return { orders, event }
          }),
        )
      })
    }
  }

  const reset = () => {
    unsubscribePersonalInformation?.()
    unsubscribePersonalInformation = null
    personalInformation.value = null
    unsubscribeOrders?.()
    unsubscribeOrders = null
    _cart.value = null
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
  const requestEmailChange = async (newEmail: string) => {
    await _requestEmailChange({ newEmail })
  }

  const confirmEmailChange = async (newEmail: string, passCode: string) => {
    const currentUser = user.value
    const currentUserPersonalInformation = personalInformation.value
    const currentFirebaseUser = firebaseUser.value
    if (currentUser == null || currentUserPersonalInformation == null || currentFirebaseUser == null) {
      throw new Error('User not logged in')
    }
    const response = await _confirmEmailChange({ newEmail, passCode })
    personalInformation.value!.user_email = newEmail
    await signInWithCustomToken(getAuth(), response.data.token)
  }

  const linkProvider = async (providerId: ProviderIdType) => {
    const currentUser = getAuth().currentUser
    if (currentUser == null) {
      throw new Error('Not logged in')
    }
    let userCredential
    if (currentUser.providerData.some((pd) => pd.providerId === providerId)) {
      userCredential = await reauthenticateByProviderService(currentUser, providerId)
    } else {
      userCredential = await linkByProviderService(currentUser, providerId)
    }

    // 早めに返すために、非同期で実行する
    updateProfileFromProviders(userCredential).catch((error) => {
      console.error('updateProfileFromProviders error:', error)
    })
  }

  const unlinkProvider = async (providerId: ProviderIdType) => {
    const currentUser = getAuth().currentUser
    const _user = user.value
    if (currentUser == null || _user == null) {
      throw new Error('Not logged in')
    }
    // 各プロバイダーは連携解除時に関連する値を削除する
    switch (providerId) {
      case 'facebook.com':
        _user.user_sns_facebook_name = ''
        break
      case 'twitter.com':
        _user.user_sns_twitter = ''
        break
    }
    await Promise.all([unlink(currentUser, providerId), updateUser(toRaw(_user))])
    providerData.value = getAuth().currentUser!.providerData
  }

  const signOut = async () => {
    await getAuth().signOut()
    // reset() は onAuthStateChanged のコールバックで呼ばれるが、念のためここでも呼んでおく
    reset()
    // リダイレクトはルーター側の onAuthStateChanged で処理される
  }

  return {
    firebaseUser,
    providerData,
    user,
    personalInformation,
    cart,
    updateUser,
    uploadUserImage,
    requestEmailChange,
    confirmEmailChange,
    linkProvider,
    unlinkProvider,
    signOut,
  }
})
