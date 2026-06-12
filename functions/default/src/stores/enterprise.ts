import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { AuditLog } from '@shokujii/common/schemas/AuditLog.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'

const enterpriseConverter: FirestoreDataConverter<Enterprise> = {
  toFirestore(enterprise: Enterprise): DocumentData {
    return enterprise.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Enterprise {
    return new Enterprise(snapshot.id, snapshot.data())
  },
}

const enterpriseMemberConverter: FirestoreDataConverter<EnterpriseMember> = {
  toFirestore(member: EnterpriseMember): DocumentData {
    return member.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): EnterpriseMember {
    return new EnterpriseMember(snapshot.id, snapshot.data())
  },
}

const auditLogConverter: FirestoreDataConverter<AuditLog> = {
  toFirestore(log: AuditLog): DocumentData {
    return log.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): AuditLog {
    return new AuditLog(snapshot.id, snapshot.data())
  },
}

export const getEnterpriseRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db.collection('enterprises').doc(enterpriseId).withConverter(enterpriseConverter)
}

export const getEnterpriseMemberRef = (enterpriseId: string, userId: string) => {
  const db = getFirestore()
  return db
    .collection('enterprises')
    .doc(enterpriseId)
    .collection('members')
    .doc(userId)
    .withConverter(enterpriseMemberConverter)
}

export const getAuditLogsCollectionRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db.collection('enterprises').doc(enterpriseId).collection('audit_logs').withConverter(auditLogConverter)
}

export const saveEnterprise = async (enterprise: Enterprise): Promise<void> => {
  await getEnterpriseRef(enterprise.id).set(enterprise)
}

export const saveEnterpriseMember = async (member: EnterpriseMember, enterpriseId: string): Promise<void> => {
  await getEnterpriseMemberRef(enterpriseId, member.id).set(member)
}

export const getEnterpriseMember = async (
  enterpriseId: string,
  userId: string,
): Promise<EnterpriseMember | undefined> => {
  const snapshot = await getEnterpriseMemberRef(enterpriseId, userId).get()
  return snapshot.exists ? snapshot.data() : undefined
}

export const getEnterpriseById = async (enterpriseId: string): Promise<Enterprise | undefined> => {
  const snapshot = await getEnterpriseRef(enterpriseId).get()
  return snapshot.exists ? snapshot.data() : undefined
}

export const getEnterpriseBySubdomain = async (subdomain: string): Promise<Enterprise | undefined> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('enterprises')
    .where('subdomain', '==', subdomain)
    .limit(1)
    .withConverter(enterpriseConverter)
    .get()
  return snapshot.empty ? undefined : snapshot.docs[0]?.data()
}

export const getEnterpriseByCustomDomain = async (customDomain: string): Promise<Enterprise | undefined> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('enterprises')
    .where('custom_domain', '==', customDomain)
    .limit(1)
    .withConverter(enterpriseConverter)
    .get()
  return snapshot.empty ? undefined : snapshot.docs[0]?.data()
}

export const saveAuditLog = async (enterpriseId: string, log: AuditLog): Promise<string> => {
  const ref = await getAuditLogsCollectionRef(enterpriseId).add(log)
  return ref.id
}
