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
  deleteDoc,
  orderBy,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { BokudeliLetter, useLetterStore, type LetterStore, letterConverter } from '@shokujii/base/stores/letter.js'
import { LetterTypeType } from '@shokujii/common/schemas/CommunityLetter.js'

type LetterListStoreState = {
  letterStores: Ref<LetterStore[] | null>
  totalCount: Ref<number | null>
} & StateTree

type LetterListStoreGetters = object

type LetterListStoreAction = {
  newLetter: (letter_type: LetterTypeType, event_id?: string) => Promise<BokudeliLetter>
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

      const newLetter = async (letter_type: LetterTypeType, event_id?: string): Promise<BokudeliLetter> => {
        const lettersRef = await getLettersRef()
        return new BokudeliLetter(lettersRef.parent!.id, null, {
          community_account: communityAccount,
          letter_type,
          ...{ event_id },
        })
      }

      const updateLetter = async (data: BokudeliLetter) => {
        const letterRef = doc(await getLettersRef(), data.letter_id)
        await setDoc(letterRef, data, { merge: true })
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
        newLetter,
        updateLetter,
        deleteLetter,
        next,
        reload,
      }
    },
  )

  return store() as LetterListStore
}
