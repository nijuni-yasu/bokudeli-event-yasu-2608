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

/**
 * カーソル doc を読み直さず、orderBy と同じ値（timestamp, documentId）で再開位置を指定する。
 * doc を read する実装ではカーソル doc が削除されていた場合に `startAfter` が付かず先頭へ巻き戻る。
 */
function applyStartAfter(query: Query<AuditLog>, cursor: AuditLogCursor): Query<AuditLog> {
  return query.startAfter(Timestamp.fromMillis(cursor.timestamp), cursor.log_id)
}

async function fetchPage(
  baseQuery: Query<AuditLog>,
  pageSize: number,
  cursor: QueryCursor,
): Promise<{ docs: QueryDocumentSnapshot<AuditLog>[]; hasNext: boolean }> {
  let query = baseQuery
  if (cursor != null) {
    query = applyStartAfter(query, cursor)
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
  // scanCursor は「最後に消費した（判定済みの）doc」を指す。next ページはここから再開する
  let scanCursor: QueryCursor = params.cursor ?? null
  let totalScanned = 0
  let exhausted = false
  let hasUnscannedInBatch = false

  while (matched.length < pageSize && totalScanned < maxScan && !exhausted) {
    const remaining = maxScan - totalScanned
    const fetchLimit = Math.min(pageSize * 2, remaining)
    let query = baseQuery
    if (scanCursor != null) {
      query = applyStartAfter(query, scanCursor)
    }
    const snapshot = await query.limit(fetchLimit).get()
    if (snapshot.docs.length < fetchLimit) {
      exhausted = true
    }

    for (const doc of snapshot.docs) {
      if (matched.length >= pageSize) {
        // ページが埋まった時点で未判定の doc が残っている（次ページはここから再開）
        hasUnscannedInBatch = true
        break
      }
      totalScanned += 1
      const log = doc.data()
      scanCursor = { timestamp: log.timestamp, log_id: doc.id }
      if (isAuditLogGuest(log.details)) {
        matched.push(log)
      }
    }
  }

  const hasNext = hasUnscannedInBatch || !exhausted
  return {
    logs: matched,
    hasNext,
    nextCursor: hasNext ? scanCursor : null,
  }
}

export const listAuditLogs = async (params: ListAuditLogsParams): Promise<ListAuditLogsResult> => {
  const { enterpriseId } = params
  if (params.actorFilter === 'guest') {
    return listAuditLogsGuest(enterpriseId, params)
  }

  const { query: baseQuery, pageSize } = applyCommonFilters(enterpriseId, params)
  const { docs, hasNext } = await fetchPage(baseQuery, pageSize, params.cursor ?? null)
  const logs = docs.map((doc) => doc.data())
  return {
    logs,
    hasNext,
    nextCursor: hasNext ? toNextCursor(docs) : null,
  }
}
