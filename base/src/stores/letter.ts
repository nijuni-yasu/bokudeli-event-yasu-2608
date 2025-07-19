import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { StateTree, Store } from 'pinia'
import { type Letter } from '@shokujii/base/schemes/letter'
import {
  getFirestore,
  onSnapshot,
  setDoc,
  DocumentReference,
  type Unsubscribe,
  DocumentSnapshot,
  where,
  query,
  getDocs,
  collectionGroup,
} from 'firebase/firestore'

const db = getFirestore()

type LetterStoreState = {
  letter: Ref<Letter | null>
} & StateTree

type LetterStoreGetters = object

type LetterStoreAction = {
  updateLetter: (data: Letter) => Promise<void>
  unsubscribe: () => void
}

export type LetterStore = Store<string, LetterStoreState, LetterStoreGetters, LetterStoreAction>
export const useLetterStore = (communityAccount: string, target: string | DocumentSnapshot): LetterStore => {
  let _letterRef: DocumentReference | null
  let letterId: string
  if (target instanceof DocumentSnapshot) {
    _letterRef = target.ref
    letterId = target.id
  } else {
    _letterRef = null
    letterId = target
  }
  const store = defineStore<string, LetterStoreState & LetterStoreGetters & LetterStoreAction>(
    `/communities/${communityAccount}/letters/${letterId}`,
    () => {
      const getLetterRef = async () => {
        if (_letterRef == null) {
          const communitySnapshot = await getDocs(
            query(
              collectionGroup(db, 'letters'),
              where('community_account', '==', communityAccount),
              where('letter_id', '==', letterId),
            ),
          )
          _letterRef = communitySnapshot.docs[0]!.ref
        }
        return _letterRef
      }

      const letter = ref<Letter | null>(null)

      let unsubscribeLetter: Unsubscribe | null = null
      const subscribeLetter = async () => {
        if (unsubscribeLetter == null) {
          unsubscribeLetter = onSnapshot(await getLetterRef(), (letterDoc) => {
            letter.value = letterDoc.data() as Letter
          })
        }
      }
      subscribeLetter()

      const updateLetter = async (data: Letter) => {
        await setDoc(await getLetterRef(), data)
      }

      const unsubscribe = () => {
        if (unsubscribeLetter != null) {
          unsubscribeLetter()
          unsubscribeLetter = null
        }
      }

      return {
        letter,
        updateLetter,
        unsubscribe,
      }
    },
  )

  return store() as LetterStore
}
