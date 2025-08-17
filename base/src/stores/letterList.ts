import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { StateTree, Store } from 'pinia'
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
  orderBy,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { BokudeliLetter, useLetterStore, type LetterStore, letterConverter } from '@shokujii/base/stores/letter.js'

type LetterListStoreState = {
  letterStores: Ref<LetterStore[] | null>
  totalCount: Ref<number | null>
} & StateTree

type LetterListStoreGetters = object

type LetterListStoreAction = {
  addLetter: (data: BokudeliLetter) => Promise<BokudeliLetter>
  updateLetter: (data: BokudeliLetter) => Promise<void>
  deleteLetter: (letterId: string) => Promise<void>
  reload: () => void
  next: () => void
}

export type LetterListStore = Store<string, LetterListStoreState, LetterListStoreGetters, LetterListStoreAction>

export const useLetterListStore = (communityAccount: string, pageSize: number = 3): LetterListStore => {
  const store = defineStore<string, LetterListStoreState & LetterListStoreGetters & LetterListStoreAction>(
    `letterList/${communityAccount}/${pageSize}`,
    () => {
      const pagenationExecutor = new TaskExecutor(1)
      const letterStores = ref<LetterStore[] | null>(null)
      const totalCount = ref<number | null>(null)

      const lettersSnapsthot: QueryDocumentSnapshot<BokudeliLetter>[] = []

      let _letterListRef: CollectionReference<BokudeliLetter> | null = null
      const getLettersRef = async () => {
        if (_letterListRef == null) {
          const communitySnapshot = await getDocs(
            query(collection(db, 'communities'), where('community_account', '==', communityAccount)),
          )
          _letterListRef = collection(communitySnapshot.docs[0].ref, 'letters').withConverter(letterConverter)
        }
        return _letterListRef
      }

      const next = () => {
        if (pagenationExecutor.totalTaskLength > 0) {
          return
        }
        pagenationExecutor.addTask(async () => {
          if (totalCount.value == null) {
            totalCount.value = (await getCountFromServer(await getLettersRef())).data().count
          }
          const lastVisibleDocument = lettersSnapsthot[lettersSnapsthot.length - 1]
          const q = query(
            await getLettersRef(),
            orderBy('updated_at', 'desc'),
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            limit(pageSize),
          )
          const querySnapshot = await getDocs(q)
          lettersSnapsthot.push(...querySnapshot.docs)
          window.setTimeout(() => {
            letterStores.value = lettersSnapsthot.map(
              (doc) => useLetterStore(communityAccount, doc.data()) as LetterStore,
            )
          })
        })
      }

      const addLetter = async (data: BokudeliLetter) => {
        const lettersRef = await getLettersRef()
        const newLetterRef = doc(await getLettersRef())
        const newData = new BokudeliLetter(lettersRef.parent!.id, newLetterRef.id, data)
        await setDoc(newLetterRef, newData)
        return newData
      }

      const updateLetter = async (data: BokudeliLetter) => {
        const letterRef = doc(await getLettersRef(), data.letter_id)
        await updateDoc(letterRef, {
          ...data,
          updated_at: Timestamp.now(),
        })
      }

      const deleteLetter = async (letterId: string) => {
        const letterRef = doc(await getLettersRef(), letterId)
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
