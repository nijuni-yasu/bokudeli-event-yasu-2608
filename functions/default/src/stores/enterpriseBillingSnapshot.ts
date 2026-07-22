import {
  DocumentData,
  FieldPath,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EnterpriseBillingSnapshot } from '@shokujii/common/schemas/Enterprise.js'

const billingSnapshotConverter: FirestoreDataConverter<EnterpriseBillingSnapshot> = {
  toFirestore(snapshot: EnterpriseBillingSnapshot): DocumentData {
    return snapshot.toFirestore()
  },
  fromFirestore(doc: QueryDocumentSnapshot): EnterpriseBillingSnapshot {
    return new EnterpriseBillingSnapshot(doc.id, doc.data())
  },
}

export const getBillingSnapshotsCollectionRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db
    .collection('enterprises')
    .doc(enterpriseId)
    .collection('billing_snapshots')
    .withConverter(billingSnapshotConverter)
}

export const getBillingSnapshotRef = (enterpriseId: string, yearMonth: string) => {
  return getBillingSnapshotsCollectionRef(enterpriseId).doc(yearMonth)
}

export const getBillingSnapshot = async (
  enterpriseId: string,
  yearMonth: string,
): Promise<EnterpriseBillingSnapshot | undefined> => {
  const snapshot = await getBillingSnapshotRef(enterpriseId, yearMonth).get()
  return snapshot.exists ? snapshot.data() : undefined
}

export const listBillingSnapshots = async (
  enterpriseId: string,
  startYearMonth: string,
  endYearMonth: string,
): Promise<EnterpriseBillingSnapshot[]> => {
  const snapshot = await getBillingSnapshotsCollectionRef(enterpriseId)
    .where(FieldPath.documentId(), '>=', startYearMonth)
    .where(FieldPath.documentId(), '<=', endYearMonth)
    .get()

  return snapshot.docs.map((doc) => doc.data())
}

export const upsertBillingSnapshot = async (
  enterpriseId: string,
  snapshot: EnterpriseBillingSnapshot,
): Promise<void> => {
  await getBillingSnapshotRef(enterpriseId, snapshot.year_month).set(snapshot)
}

export const listAllEnterpriseIds = async (): Promise<string[]> => {
  const db = getFirestore()
  const snapshot = await db.collection('enterprises').select().get()
  return snapshot.docs.map((doc) => doc.id)
}
