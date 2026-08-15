import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Letter } from '@shokujii/common/schemas/CommunityLetter.js'
import {
  getFirestore,
  onSnapshot,
  setDoc,
  DocumentReference,
  type Unsubscribe,
  doc,
  collection,
  DocumentData,
  SnapshotOptions,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
} from 'firebase/firestore'

import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { isFirestorePermissionDenied } from '@shokujii/base/utils/firestoreError.js'
import {
  resolveCommunityDocumentRef,
  resolveCommunityStoreKey,
  type CommunityStoreScope,
} from '@shokujii/base/stores/community.js'

const db = getFirestore()

export class BokudeliLetter extends Letter {
  constructor(community_id: string, letter_id: string | null, src: Partial<Letter>) {
    letter_id = letter_id ?? doc(collection(db, 'communities', community_id, 'letters')).id
    super(letter_id, src)
  }
}

export const letterConverter: FirestoreDataConverter<BokudeliLetter> = {
  toFirestore(letter: BokudeliLetter): DocumentData {
    return letter.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliLetter {
    const data = snapshot.data(options)
    const community_id = snapshot.ref.parent.parent!.id
    return new BokudeliLetter(community_id, snapshot.id, data)
  },
}

export type LetterStore = ReturnType<typeof useLetterStore>
export const useLetterStore = (
  communityAccount: string,
  target: string | BokudeliLetter,
  scope?: CommunityStoreScope,
) => {
  let _letterRef: DocumentReference<BokudeliLetter> | null = null
  let letterId: string
  if (target instanceof BokudeliLetter) {
    letterId = target.letter_id
  } else {
    letterId = target
  }
  const storeKey = resolveCommunityStoreKey(scope?.enterpriseId)
  const store = defineStore(`/communities/${storeKey}/${communityAccount}/letters/${letterId}`, () => {
    const getLetterRef = async () => {
      if (_letterRef == null) {
        const communityRef = await resolveCommunityDocumentRef(communityAccount, scope)
        _letterRef = doc(collection(communityRef, 'letters'), letterId).withConverter(letterConverter)
      }
      return _letterRef
    }

    const letter = ref<BokudeliLetter | null>(null)

    let unsubscribeLetter: Unsubscribe | null = null
    const subscribeLetter = async () => {
      if (unsubscribeLetter == null) {
        const letterRef = await getLetterRef()
        unsubscribeLetter = onSnapshot(
          letterRef,
          (letterDoc) => {
            try {
              letter.value = letterDoc.data() ?? null
            } catch (err) {
              console.error(err)
              reportClientError(err, { documentPath: letterDoc.ref.path, severity: 'warn' })
            }
          },
          (err) => {
            console.error('subscribeLetter snapshot error', err)
            if (isFirestorePermissionDenied(err)) {
              letter.value = null
              unsubscribeLetter?.()
              unsubscribeLetter = null
              return
            }
            reportClientError(err, { documentPath: letterRef.path, severity: 'warn' })
          },
        )
      }
    }
    subscribeLetter()

    const updateLetter = async (data: BokudeliLetter) => {
      await setDoc(await getLetterRef(), data)
    }

    const copyLetter = async (): Promise<BokudeliLetter> => {
      const letterRef = await getLetterRef()
      const newLetter = new BokudeliLetter(letterRef.parent.parent!.id, null, letter.value!)
      newLetter.scheduled_at = Date.now()
      delete newLetter.sent_at
      return newLetter
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
      copyLetter,
      unsubscribe,
    }
  })

  return store()
}
