import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore'
import { PassCode } from '@shokujii/common/schemas/PassCode.js'

const PASS_CODE_DURATION = 24 * 60 * 60 * 1000 // 1 day

export class ShokujiiPassCode extends PassCode {
  constructor(id: string | null, src: Partial<PassCode>) {
    const db = getFirestore()
    if (id === null) {
      id = db.collection('pass_code').doc().id
    }
    super(id, src)
  }
}

const passCodeConverter: FirestoreDataConverter<PassCode> = {
  toFirestore(passCode: PassCode): DocumentData {
    return passCode.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): PassCode {
    return new PassCode(snapshot.id, snapshot.data())
  },
}

export const savePassCode = async (passCode: PassCode, transaction?: Transaction) => {
  const db = getFirestore()
  const passCodeRef = db.collection('pass_code').doc(passCode.id).withConverter(passCodeConverter)
  if (transaction === undefined) {
    await passCodeRef.set(passCode, { merge: true })
  } else {
    transaction.set(passCodeRef, passCode, { merge: true })
  }
}

export const getValidPassCodeFromEmail = async (email: string): Promise<PassCode | undefined> => {
  const db = getFirestore()
  const passCodeSnapShots = await db
    .collection('pass_code')
    .where('user_email', '==', email)
    .where('created_at', '>', Timestamp.fromMillis(Date.now() - PASS_CODE_DURATION))
    .orderBy('created_at', 'desc')
    .limit(1)
    .withConverter(passCodeConverter)
    .get()
  return passCodeSnapShots.docs[0]?.data()
}

export const deletePassCode = async (id: string) => {
  const db = getFirestore()
  await db.collection('pass_code').doc(id).delete()
}
