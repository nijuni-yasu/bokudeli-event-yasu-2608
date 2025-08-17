import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { StateTree, Store } from 'pinia'
import { Letter } from '@shokujii/common/schemas/CommunityLetter.js'
import {
  getFirestore,
  onSnapshot,
  setDoc,
  DocumentReference,
  type Unsubscribe,
  where,
  query,
  getDocs,
  collectionGroup,
  doc,
  collection,
  DocumentData,
  SnapshotOptions,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
} from 'firebase/firestore'

const db = getFirestore()

export class BokudeliLetter extends Letter {
  constructor(community_id: string, letter_id: string | null, src: Partial<Letter>) {
    letter_id = letter_id ?? doc(collection(db, 'communities', community_id, 'letters')).id
    super(letter_id, src)
  }
}

export const letterConverter: FirestoreDataConverter<BokudeliLetter> = {
  toFirestore(shop: BokudeliLetter): DocumentData {
    return shop.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliLetter {
    const data = snapshot.data(options)
    const community_id = snapshot.ref.parent.parent!.id
    return new BokudeliLetter(community_id, snapshot.id, data)
  },
}

type LetterStoreState = {
  letter: Ref<BokudeliLetter | null>
} & StateTree

type LetterStoreGetters = object

type LetterStoreAction = {
  updateLetter: (data: BokudeliLetter) => Promise<void>
  unsubscribe: () => void
}

export type LetterStore = Store<string, LetterStoreState, LetterStoreGetters, LetterStoreAction>
export const useLetterStore = (communityAccount: string, target: string | BokudeliLetter): LetterStore => {
  let _letterRef: DocumentReference<BokudeliLetter> | null = null
  let letterId: string
  if (target instanceof BokudeliLetter) {
    letterId = target.letter_id
  } else {
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
            ).withConverter(letterConverter),
          )
          _letterRef = communitySnapshot.docs[0]!.ref
        }
        return _letterRef
      }

      const letter = ref<BokudeliLetter | null>(null)

      let unsubscribeLetter: Unsubscribe | null = null
      const subscribeLetter = async () => {
        if (unsubscribeLetter == null) {
          unsubscribeLetter = onSnapshot(await getLetterRef(), (letterDoc) => {
            try {
              letter.value = letterDoc.data() ?? null
            } catch (err) {
              console.error(err)
            }
          })
        }
      }
      subscribeLetter()

      const updateLetter = async (data: BokudeliLetter) => {
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
