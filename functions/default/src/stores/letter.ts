import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
  DocumentReference,
} from 'firebase-admin/firestore'
import { Letter } from '@shokujii/common/schemas/CommunityLetter.js'

const letterConverter: FirestoreDataConverter<Letter> = {
  toFirestore(letter: Letter): DocumentData {
    return letter.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Letter {
    return new Letter(snapshot.id, snapshot.data())
  },
}

export const getLetter = async (communityId: string, letterId: string): Promise<Letter | undefined> => {
  const db = getFirestore()
  const letterRef = db
    .collection('communities')
    .doc(communityId)
    .collection('letters')
    .doc(letterId)
    .withConverter(letterConverter)
  const snapshot = await letterRef.get()
  return snapshot.data()
}

export const getScheduledLetters = async (
  endTime: number,
  transaction?: Transaction,
): Promise<{ letter: Letter; ref: DocumentReference }[]> => {
  const db = getFirestore()
  const lettersRef = db
    .collectionGroup('letters')
    .where('status', '==', 'timed')
    .where('scheduled_at', '<=', Timestamp.fromMillis(endTime))
    .withConverter(letterConverter)

  const snapshot = await (transaction === undefined ? lettersRef.get() : transaction.get(lettersRef))
  return snapshot.docs.map((doc) => ({
    letter: doc.data(),
    ref: doc.ref,
  }))
}

export const updateSentStatus = async (ref: DocumentReference, transaction?: Transaction): Promise<void> => {
  if (transaction) {
    transaction.update(ref, { status: 'sent', sent_at: Timestamp.now() })
  } else {
    await ref.update({ status: 'sent', sent_at: Timestamp.now() })
  }
}
