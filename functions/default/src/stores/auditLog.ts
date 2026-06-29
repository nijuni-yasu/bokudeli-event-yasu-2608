import { FieldPath, Timestamp, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { AuditLog } from '@shokujii/common/schemas/AuditLog.js'
import type { AuditLogActorFilter, AuditLogCursor } from '@shokujii/common/apis/auditLog.js'
import {
  GUEST_FILTER_SCAN_MULTIPLIER,
  normalizeAuditLogPageSize,
  parseAuditLogDateRange,
} from '@shokujii/common/utils/auditLogCursor.js'
import { isAuditLogGuest } from '@shokujii/common/utils/auditLogDisplay.js'
import { getAuditLogsCollectionRef } from './enterprise.js'

export type ListAuditLogsParams = {
  enterpriseId: string
  action?: string
  actorFilter?: AuditLogActorFilter
  startDate?: string
  endDate?: string
  pageSize?: number
  cursor?: AuditLogCursor
}

export type ListAuditLogsResult = {
  logs: AuditLog[]
  hasNext: boolean
  nextCursor: AuditLogCursor | null
}

type QueryCursor = AuditLogCursor | null

function applyActorFilter(query: Query<AuditLog>, actorFilter: AuditLogActorFilter | undefined): Query<AuditLog> {
  if (actorFilter == null || actorFilter === 'all' || actorFilter === 'guest') {
    return query
  }
  if (actorFilter === 'system') {
    return query.where('user_id', '==', 'system')
  }
  return query.where('user_id', '==', actorFilter.user_id)
}

function applyCommonFilters(
  enterpriseId: string,
  params: ListAuditLogsParams,
): { query: Query<AuditLog>; pageSize: number; startMillis?: number; endMillis?: number } {
  const pageSize = normalizeAuditLogPageSize(params.pageSize)
  const { startMillis, endMillis } = parseAuditLogDateRange(params.startDate, params.endDate)

  let query: Query<AuditLog> = getAuditLogsCollectionRef(enterpriseId)
    .orderBy('timestamp', 'desc')
    .orderBy(FieldPath.documentId(), 'asc')

  if (params.action != null && params.action !== '') {
    query = query.where('action', '==', params.action)
  }

  query = applyActorFilter(query, params.actorFilter)

  if (startMillis != null) {
    query = query.where('timestamp', '>=', Timestamp.fromMillis(startMillis))
  }
  if (endMillis != null) {
    query = query.where('timestamp', '<=', Timestamp.fromMillis(endMillis))
  }

  return { query, pageSize, startMillis, endMillis }
}

async function applyStartAfter(
  query: Query<AuditLog>,
  enterpriseId: string,
  cursor: AuditLogCursor,
): Promise<Query<AuditLog>> {
  const cursorRef = getAuditLogsCollectionRef(enterpriseId).doc(cursor.log_id)
  const cursorSnap = await cursorRef.get()
  if (!cursorSnap.exists) {
    return query
  }
  return query.startAfter(cursorSnap)
}

async function fetchPage(
  baseQuery: Query<AuditLog>,
  enterpriseId: string,
  pageSize: number,
  cursor: QueryCursor,
): Promise<{ docs: QueryDocumentSnapshot<AuditLog>[]; hasNext: boolean }> {
  let query = baseQuery
  if (cursor != null) {
    query = await applyStartAfter(query, enterpriseId, cursor)
  }

  const snapshot = await query.limit(pageSize + 1).get()
  const docs = snapshot.docs
  const hasNext = docs.length > pageSize
  const pageDocs = hasNext ? docs.slice(0, pageSize) : docs
  return { docs: pageDocs, hasNext }
}

function toNextCursor(docs: QueryDocumentSnapshot<AuditLog>[]): AuditLogCursor | null {
  if (docs.length === 0) {
    return null
  }
  const lastDoc = docs[docs.length - 1]
  const data = lastDoc.data()
  return {
    timestamp: data.timestamp,
    log_id: lastDoc.id,
  }
}

async function listAuditLogsGuest(enterpriseId: string, params: ListAuditLogsParams): Promise<ListAuditLogsResult> {
  const { query: baseQuery, pageSize } = applyCommonFilters(enterpriseId, params)
  const maxScan = pageSize * GUEST_FILTER_SCAN_MULTIPLIER
  const matched: AuditLog[] = []
  let scanCursor: QueryCursor = params.cursor ?? null
  let totalScanned = 0
  let exhausted = false

  while (matched.length < pageSize && totalScanned < maxScan) {
    const remaining = maxScan - totalScanned
    const fetchLimit = Math.min(pageSize * 2, remaining)
    let query = baseQuery
    if (scanCursor != null) {
      query = await applyStartAfter(query, enterpriseId, scanCursor)
    }
    const snapshot = await query.limit(fetchLimit).get()
    if (snapshot.empty) {
      exhausted = true
      break
    }

    totalScanned += snapshot.docs.length
    if (snapshot.docs.length < fetchLimit) {
      exhausted = true
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1]
    scanCursor = {
      timestamp: lastDoc.data().timestamp,
      log_id: lastDoc.id,
    }

    for (const doc of snapshot.docs) {
      const log = doc.data()
      if (!isAuditLogGuest(log.details)) {
        continue
      }
      matched.push(log)
      if (matched.length >= pageSize) {
        break
      }
    }
  }

  const logs = matched.slice(0, pageSize)
  const hasNext = logs.length === pageSize && !exhausted
  return {
    logs,
    hasNext,
    nextCursor: logs.length > 0 ? toNextCursorFromLogs(logs) : null,
  }
}

function toNextCursorFromLogs(logs: AuditLog[]): AuditLogCursor | null {
  const last = logs[logs.length - 1]
  if (last == null) {
    return null
  }
  return { timestamp: last.timestamp, log_id: last.id }
}

export const listAuditLogs = async (params: ListAuditLogsParams): Promise<ListAuditLogsResult> => {
  const { enterpriseId } = params
  if (params.actorFilter === 'guest') {
    return listAuditLogsGuest(enterpriseId, params)
  }

  const { query: baseQuery, pageSize } = applyCommonFilters(enterpriseId, params)
  const { docs, hasNext } = await fetchPage(baseQuery, enterpriseId, pageSize, params.cursor ?? null)
  const logs = docs.map((doc) => doc.data())
  return {
    logs,
    hasNext,
    nextCursor: hasNext ? toNextCursor(docs) : null,
  }
}
