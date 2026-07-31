import {
  DocumentData,
  FieldPath,
  FieldValue,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
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

export const getEnterpriseMembersCollectionRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db.collection('enterprises').doc(enterpriseId).collection('members').withConverter(enterpriseMemberConverter)
}

export const listEnterpriseMembers = async (enterpriseId: string): Promise<EnterpriseMember[]> => {
  const snapshot = await getEnterpriseMembersCollectionRef(enterpriseId).get()
  return snapshot.docs.map((doc) => doc.data())
}

export const countActiveEnterpriseAdmins = async (enterpriseId: string, excludeUserId?: string): Promise<number> => {
  const members = await listEnterpriseMembers(enterpriseId)
  return members.filter(
    (m) => m.role === 'admin' && m.is_active && (excludeUserId == null || m.user_id !== excludeUserId),
  ).length
}

export const getAuditLogsCollectionRef = (enterpriseId: string) => {
  const db = getFirestore()
  return db.collection('enterprises').doc(enterpriseId).collection('audit_logs').withConverter(auditLogConverter)
}

export const saveEnterprise = async (enterprise: Enterprise): Promise<void> => {
  await getEnterpriseRef(enterprise.id).set(enterprise)
}

export const deleteEnterprise = async (enterpriseId: string): Promise<void> => {
  await getEnterpriseRef(enterpriseId).delete()
}

export const saveEnterpriseMember = async (member: EnterpriseMember, enterpriseId: string): Promise<void> => {
  await getEnterpriseMemberRef(enterpriseId, member.id).set(member)
}

export const deleteEnterpriseMember = async (enterpriseId: string, userId: string): Promise<void> => {
  await getEnterpriseMemberRef(enterpriseId, userId).delete()
}

export const getEnterpriseMember = async (
  enterpriseId: string,
  userId: string,
): Promise<EnterpriseMember | undefined> => {
  const snapshot = await getEnterpriseMemberRef(enterpriseId, userId).get()
  return snapshot.exists ? snapshot.data() : undefined
}

export const getEnterpriseMemberInTransaction = async (
  enterpriseId: string,
  userId: string,
  transaction: Transaction,
): Promise<EnterpriseMember | undefined> => {
  const snapshot = await transaction.get(getEnterpriseMemberRef(enterpriseId, userId))
  return snapshot.exists ? snapshot.data() : undefined
}

export type EnterpriseMemberMonthlyUsageAdjustment = {
  userId: string
  eventMonth: string
  subsidyDelta: number
  orderCountDelta: number
  userPaidDelta: number
}

/**
 * 複数メンバーの monthly_usage / monthly_order_count / monthly_user_paid を Transaction 内で加減算（Math.max(0, ...) でガード）。
 * Firestore Transaction は write 後の read を拒否するため、全メンバーを先に read してから write する。
 */
export const adjustEnterpriseMemberMonthlyUsageBulk = async (
  enterpriseId: string,
  adjustments: EnterpriseMemberMonthlyUsageAdjustment[],
  transaction: Transaction,
): Promise<void> => {
  const memberRefs = adjustments.map((adjustment) => getEnterpriseMemberRef(enterpriseId, adjustment.userId))
  const snapshots = await Promise.all(memberRefs.map((memberRef) => transaction.get(memberRef)))
  for (const [index, adjustment] of adjustments.entries()) {
    const memberRef = memberRefs[index]
    const snapshot = snapshots[index]
    if (memberRef == null || snapshot == null || !snapshot.exists) {
      throw new Error(`EnterpriseMember not found: ${enterpriseId}/${adjustment.userId}`)
    }
    const member = snapshot.data()
    if (member == null) {
      throw new Error(`EnterpriseMember data is empty: ${enterpriseId}/${adjustment.userId}`)
    }
    const newUsage = Math.max(0, (member.monthly_usage[adjustment.eventMonth] ?? 0) + adjustment.subsidyDelta)
    const newCount = Math.max(0, (member.monthly_order_count[adjustment.eventMonth] ?? 0) + adjustment.orderCountDelta)
    const newUserPaid = Math.max(0, (member.monthly_user_paid[adjustment.eventMonth] ?? 0) + adjustment.userPaidDelta)
    transaction.update(
      memberRef,
      new FieldPath('monthly_usage', adjustment.eventMonth),
      newUsage,
      new FieldPath('monthly_order_count', adjustment.eventMonth),
      newCount,
      new FieldPath('monthly_user_paid', adjustment.eventMonth),
      newUserPaid,
      'updated_at',
      FieldValue.serverTimestamp(),
    )
  }
}

/** monthly_usage / monthly_order_count / monthly_user_paid を Transaction 内で加減算（Math.max(0, ...) でガード） */
export const adjustEnterpriseMemberMonthlyUsage = async (
  enterpriseId: string,
  userId: string,
  eventMonth: string,
  subsidyDelta: number,
  orderCountDelta: number,
  userPaidDelta: number,
  transaction: Transaction,
): Promise<void> => {
  await adjustEnterpriseMemberMonthlyUsageBulk(
    enterpriseId,
    [{ userId, eventMonth, subsidyDelta, orderCountDelta, userPaidDelta }],
    transaction,
  )
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

export const getEnterpriseMemberUserIdByEmail = async (
  enterpriseId: string,
  email: string,
): Promise<string | undefined> => {
  const snapshot = await getEnterpriseMembersCollectionRef(enterpriseId).where('user_email', '==', email).limit(1).get()
  if (snapshot.empty) {
    return undefined
  }
  return snapshot.docs[0]?.id
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
