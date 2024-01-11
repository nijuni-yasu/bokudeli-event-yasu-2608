import { db } from '@/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { StateTree, Store } from 'pinia';
import { FirestoredUser } from '@/schemes/storedUser'


type UserStoreState = {
  exists: Ref<boolean | null>,
  user: Ref<FirestoredUser | null>,
} & StateTree;

type UserStoreAction = {
  updateUser: (data: Partial<FirestoredUser>) => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => void,
}

export type UserStore = Store<string, UserStoreState, Record<string, never>, UserStoreAction>

export const useUserStore = (userId: string): UserStore => {
  const store = defineStore<string, UserStoreState>(`/users/${userId}`, () => {
    const userRef: DocumentReference = doc(db, 'users', userId)
    const exists = ref<boolean | null>(null)
    const user = ref<FirestoredUser | null>(null)

    const updateUser = async (data: Partial<FirestoredUser>) => {
      return await updateDoc(userRef, data)
    }

    let unsubscribeUser: Unsubscribe | null = null
    const subscribe = () => {
      getDoc(userRef).then((DocumentSnapshot) => exists.value = DocumentSnapshot.exists())
      if (unsubscribeUser == null) {
        unsubscribeUser = onSnapshot(userRef, (doc: DocumentSnapshot) => {
          const data = doc.data()
          user.value = data ? data as FirestoredUser : null
        })
      }
    }

    subscribe()

    return {
      exists,
      user,
      updateUser,
      subscribe,
      unsubscribe: () => {
        unsubscribeUser?.()
        unsubscribeUser = null
      }
    }
  })
  return store() as UserStore
}