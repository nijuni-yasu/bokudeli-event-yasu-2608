import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  getDocs,
  query,
  limit,
  startAfter,
  getCountFromServer,
  doc,
  setDoc,
  deleteDoc,
  type QueryDocumentSnapshot,
  orderBy,
} from 'firebase/firestore'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { BokudeliLetter, useLetterStore, type LetterStore, letterConverter } from '@shokujii/base/stores/letter.js'
import { LetterTypeType } from '@shokujii/common/schemas/CommunityLetter.js'
import {
  resolveCommunityDocumentRef,
  resolveCommunityStoreKey,
  type CommunityStoreScope,
} from '@shokujii/base/stores/community.js'
import { isFirestorePermissionDenied } from '@shokujii/base/utils/firestoreError.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import type { CollectionReference } from 'firebase/firestore'

export type LetterListStore = ReturnType<typeof useLetterListStore>

export const useLetterListStore = (communityAccount: string, pageSize: number = 3, scope?: CommunityStoreScope) => {
  const storeKey = resolveCommunityStoreKey(scope?.enterpriseId)
  const store = defineStore(`letterList/${storeKey}/${communityAccount}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const letterStores = ref<LetterStore[] | null>(null)
    const totalCount = ref<number | null>(null)
    const permissionDenied = ref(false)

    const lettersSnapsthot: QueryDocumentSnapshot<BokudeliLetter>[] = []

    let _letterListRef: CollectionReference<BokudeliLetter> | null = null
    const getLettersRef = async () => {
      if (_letterListRef == null) {
        const communityRef = await resolveCommunityDocumentRef(communityAccount, scope)
        _letterListRef = collection(communityRef, 'letters').withConverter(letterConverter)
      }
      return _letterListRef
    }

    const handleLoadError = (error: unknown) => {
      if (isFirestorePermissionDenied(error)) {
        permissionDenied.value = true
        letterStores.value = []
        totalCount.value = 0
        return
      }
      reportClientError(error, {
        documentPath: _letterListRef?.path ?? `communities/${communityAccount}/letters`,
        severity: 'warn',
      })
    }

    const next = () => {
      if (paginationExecutor.totalTaskLength > 0 || permissionDenied.value) {
        return
      }
      paginationExecutor.addTask(async () => {
        try {
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
              (doc) => useLetterStore(communityAccount, doc.data(), scope) as LetterStore,
            )
          })
        } catch (error) {
          handleLoadError(error)
        }
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
      const lettersRef = await getLettersRef()
      const letterRef = doc(lettersRef, data.letter_id)
      await setDoc(letterRef, data, { merge: true })
    }

    const deleteLetter = async (letterId: string) => {
      const lettersRef = await getLettersRef()
      const letterRef = doc(lettersRef, letterId)
      await deleteDoc(letterRef)
    }

    const reload = () => {
      lettersSnapsthot.splice(0) // clear
      letterStores.value = null
      totalCount.value = null
      permissionDenied.value = false
      next()
    }

    reload()

    return {
      letterStores,
      totalCount,
      permissionDenied,
      newLetter,
      updateLetter,
      deleteLetter,
      next,
      reload,
    }
  })

  return store()
}
