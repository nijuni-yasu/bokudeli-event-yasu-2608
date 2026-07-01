import {
  doc,
  getDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { Enterprise } from '@shokujii/common/schemas/Enterprise.js'

const enterpriseConverter: FirestoreDataConverter<Enterprise> = {
  toFirestore(enterprise: Enterprise): DocumentData {
    return enterprise.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Enterprise {
    return new Enterprise(snapshot.id, snapshot.data(options))
  },
}

export const getEnterpriseRef = (enterpriseId: string) =>
  doc(db, 'enterprises', enterpriseId).withConverter(enterpriseConverter)

export const getEnterpriseById = async (enterpriseId: string): Promise<Enterprise | undefined> => {
  const snapshot = await getDoc(getEnterpriseRef(enterpriseId))
  return snapshot.exists() ? snapshot.data() : undefined
}
