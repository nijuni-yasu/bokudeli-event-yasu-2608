import {
  doc,
  getDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'

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

const enterpriseMemberConverter: FirestoreDataConverter<EnterpriseMember> = {
  toFirestore(member: EnterpriseMember): DocumentData {
    return member.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EnterpriseMember {
    return new EnterpriseMember(snapshot.id, snapshot.data(options))
  },
}

export const getEnterpriseMemberRef = (enterpriseId: string, userId: string) =>
  doc(db, 'enterprises', enterpriseId, 'members', userId).withConverter(enterpriseMemberConverter)

export const getEnterpriseMemberById = async (
  enterpriseId: string,
  userId: string,
): Promise<EnterpriseMember | undefined> => {
  const snapshot = await getDoc(getEnterpriseMemberRef(enterpriseId, userId))
  return snapshot.exists() ? snapshot.data() : undefined
}
