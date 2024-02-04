import { db } from '@/firebase'
import {
  doc,
  updateDoc,
  onSnapshot,
  DocumentReference,
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
  subscribe: () => void,
  unsubscribe: () => void,
}

export type UserStore = Store<string, UserStoreState, Record<string, never>, UserStoreAction>

export const useUserStore = (userId: string) => {
  const store = defineStore<string, UserStoreState & UserStoreAction>(`/users/${userId}`, () => {
    const userRef: DocumentReference = doc(db, 'users', userId)
    const exists = ref<boolean | null>(null)
    const user = ref<FirestoredUser | null>(null)

    const updateUser = async (data: Partial<FirestoredUser>) => {
      await updateDoc(userRef, data)
    }

    let unsubscribeUser: Unsubscribe | null = null
    const subscribe = () => {
      if (unsubscribeUser == null) {
        unsubscribeUser = onSnapshot(userRef, (userSnapshot) => {
          exists.value = userSnapshot.exists()
          user.value = userSnapshot.data() as FirestoredUser ?? null
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
  return store()
}