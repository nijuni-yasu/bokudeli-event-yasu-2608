import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { EnterpriseInvoiceFile } from '@shokujii/common/schemas/Enterprise.js'

/** Firestore gRPC status: ALREADY_EXISTS */
const FIRESTORE_ALREADY_EXISTS_CODE = 6

const invoiceFileConverter: FirestoreDataConverter<EnterpriseInvoiceFile> = {
  toFirestore(invoiceFile: EnterpriseInvoiceFile): DocumentData {
    return invoiceFile.toFirestore()
  },
  fromFirestore(doc: QueryDocumentSnapshot): EnterpriseInvoiceFile {
    return new EnterpriseInvoiceFile(doc.id, doc.data() as Pick<EnterpriseInvoiceFile, 'gcs_id'>)
  },
}

export const getInvoiceFilesCollectionRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db.collection('enterprises').doc(enterpriseId).collection('invoice_files').withConverter(invoiceFileConverter)
}

export const getInvoiceFileMetaRef = (enterpriseId: string, yearMonth: string) => {
  return getInvoiceFilesCollectionRef(enterpriseId).doc(yearMonth)
}

export const getInvoiceFileMeta = async (
  enterpriseId: string,
  yearMonth: string,
): Promise<EnterpriseInvoiceFile | undefined> => {
  const snapshot = await getInvoiceFileMetaRef(enterpriseId, yearMonth).get()
  return snapshot.exists ? snapshot.data() : undefined
}

export const setInvoiceFileMeta = async (
  enterpriseId: string,
  yearMonth: string,
  gcsId: string,
): Promise<'created' | 'already_exists'> => {
  const ref = getInvoiceFileMetaRef(enterpriseId, yearMonth)
  try {
    await ref.create(new EnterpriseInvoiceFile(yearMonth, { gcs_id: gcsId }))
    return 'created'
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code === FIRESTORE_ALREADY_EXISTS_CODE) {
      return 'already_exists'
    }
    throw error
  }
}

export const deleteInvoiceFileMeta = async (enterpriseId: string, yearMonth: string): Promise<void> => {
  await getInvoiceFileMetaRef(enterpriseId, yearMonth).delete()
}
