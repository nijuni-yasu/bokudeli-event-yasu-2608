import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
  DocumentReference,
} from 'firebase-admin/firestore'
import { Letter, LetterStatusType } from '@shokujii/common/schemas/CommunityLetter.js'

const letterConverter: FirestoreDataConverter<Letter> = {
  toFirestore(letter: Letter): DocumentData {
    return letter.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Letter {
    return new Letter(snapshot.id, snapshot.data())
  },
}

export const getLetterRef = (communityId: string, letterId: string): DocumentReference<Letter> => {
  const db = getFirestore()
  return db
    .collection('communities')
    .doc(communityId)
    .collection('letters')
    .doc(letterId)
    .withConverter(letterConverter)
}

export const getLetter = async (communityId: string, letterId: string): Promise<Letter | undefined> => {
  const letterRef = getLetterRef(communityId, letterId)
  const snapshot = await letterRef.get()
  return snapshot.data()
}

export const getScheduledLetters = async (
  endTime: number,
  transaction?: Transaction,
): Promise<{ letter: Letter; ref: DocumentReference<Letter> }[]> => {
  const db = getFirestore()
  const lettersRef = db
    .collectionGroup('letters')
    .where('status', '==', 'timed')
    .where('scheduled_at', '<=', Timestamp.fromMillis(endTime))
    .withConverter(letterConverter)

  const snapshot = await (transaction === undefined ? lettersRef.get() : transaction.get(lettersRef))
  return snapshot.docs.map((doc) => ({
    letter: doc.data(),
    ref: doc.ref.withConverter(letterConverter),
  }))
}

/**
 * レターのステータスを確認して更新（トランザクション内）
 * 二重送信防止のため、期待するステータスと異なる場合はエラーをスロー
 */
export const updateLetterStatusWithCheck = async (
  letterRef: DocumentReference<Letter>,
  expectedStatus: LetterStatusType,
  newStatus: LetterStatusType,
): Promise<void> => {
  const db = getFirestore()
  await db.runTransaction(async (transaction) => {
    const currentDoc = await transaction.get(letterRef)
    const letter = currentDoc.data()
    if (!letter) {
      throw new Error('Letter not found')
    }
    if (letter.status !== expectedStatus) {
      throw new Error(`Letter status is not '${expectedStatus}': ${letter.status}`)
    }
    letter.status = newStatus
    letter.sent_at = Date.now()
    transaction.set(letterRef, letter, { merge: true })
  })
}
