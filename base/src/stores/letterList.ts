import { type Ref } from 'vue'
import { db } from '@/firebase'
import {
  collection,
  getDocs,
  query,
  limit,
  startAfter,
  getCountFromServer,
  type QueryDocumentSnapshot,
  where,
  CollectionReference,
  doc,
  setDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import type { StateTree, Store } from 'pinia'
import { TaskExecutor } from '@/utils/executors'
import { useLetterStore, type LetterStore } from './letter'
import type { Letter } from '@/schemes/letter'

type LetterListStoreState = {
  letterStores: Ref<LetterStore[] | null>
  totalCount: Ref<number | null>
} & StateTree

type LetterListStoreGetters = {}

type LetterListStoreAction = {
  addLetter: (data: Letter) => Promise<string>
  updateLetter: (data: Letter) => Promise<void>
  deleteLetter: (letterId: string) => Promise<void>
  reload: () => void
  next: () => void
}

export type LetterListStore = Store<string, LetterListStoreState, LetterListStoreGetters, LetterListStoreAction>

export const useLetterListStore = (communityAccount: string, pageSize: number = 3): LetterListStore => {
  const store = defineStore<string, LetterListStoreState & LetterListStoreGetters & LetterListStoreAction>(
    `letterList/${pageSize}`,
    () => {
      const pagenationExecutor = new TaskExecutor(1)
      const letterStores = ref<LetterStore[] | null>(null)
      const totalCount = ref<number | null>(null)

      const lettersSnapsthot: QueryDocumentSnapshot[] = []

      let _letterListRef: CollectionReference | null = null
      const getLetterRef = async () => {
        if (_letterListRef == null) {
          const communitySnapshot = await getDocs(
            query(collection(db, 'communities'), where('community_account', '==', communityAccount)),
          )
          _letterListRef = collection(communitySnapshot.docs[0].ref, 'letters')
        }
        return _letterListRef
      }

      const next = () => {
        if (pagenationExecutor.totalTaskLength > 0) {
          return
        }
        pagenationExecutor.addTask(async () => {
          if (totalCount.value == null) {
            totalCount.value = (await getCountFromServer(await getLetterRef())).data().count
          }
          const lastVisibleDocument = lettersSnapsthot[lettersSnapsthot.length - 1]
          const q = query(
            await getLetterRef(),
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            limit(pageSize),
          )
          const querySnapshot = await getDocs(q)
          lettersSnapsthot.push(...querySnapshot.docs)
          window.setTimeout(() => {
            letterStores.value = lettersSnapsthot.map((doc) => useLetterStore(communityAccount, doc) as LetterStore)
          })
        })
      }

      const addLetter = async (data: Letter) => {
        const newLetterRef = doc(await getLetterRef())
        await setDoc(newLetterRef, {
          ...data,
          letter_id: newLetterRef.id,
          updated_at: Timestamp.now(),
        })
        return newLetterRef.id
      }

      const updateLetter = async (data: Letter) => {
        const letterRef = doc(await getLetterRef(), data.letter_id)
        await updateDoc(letterRef, {
          ...data,
          updated_at: Timestamp.now(),
        })
      }

      const deleteLetter = async (letterId: string) => {
        const letterRef = doc(await getLetterRef(), letterId)
        await deleteDoc(letterRef)
      }

      const reload = () => {
        lettersSnapsthot.splice(0) // clear
        letterStores.value = null
        totalCount.value = null
        next()
      }

      reload()

      return {
        letterStores,
        totalCount,
        addLetter,
        updateLetter,
        deleteLetter,
        next,
        reload,
      }
    },
  )

  return store() as LetterListStore
}
