import { onCall, HttpsError } from 'firebase-functions/https'
import type {
  AuditLogListItem,
  GetEnterpriseAuditLogsRequest,
  GetEnterpriseAuditLogsResponse,
} from '@shokujii/common/apis/auditLog.js'
import { AuditLog } from '@shokujii/common/schemas/AuditLog.js'
import {
  AuditLogQueryError,
  decodeAuditLogCursor,
  encodeAuditLogCursor,
} from '@shokujii/common/utils/auditLogCursor.js'
import {
  buildAuditLogOperatorLabel,
  buildAuditLogTargetLabel,
  isAuditLogGuest,
} from '@shokujii/common/utils/auditLogDisplay.js'
import { getCommunitiesByIds } from '../stores/community.js'
import { getEventsInCommunities, getCommunityEventKey } from '../stores/event.js'
import { getEnterpriseById, listEnterpriseMembers } from '../stores/enterprise.js'
import { listAuditLogs } from '../stores/auditLog.js'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'

const DISPLAY_LABELS = {
  system: 'システム',
  guestSuffix: '（ゲスト）',
  settings: '全社設定',
  enterpriseSubsidySettings: '補助設定',
  orderSession: (count: number) => `注文セッション（${count}件）`,
  fallback: '—',
} as const

function parseActorFilter(
  raw: GetEnterpriseAuditLogsRequest['actor_filter'],
): GetEnterpriseAuditLogsRequest['actor_filter'] {
  if (raw == null) {
    return 'all'
  }
  if (raw === 'all' || raw === 'system' || raw === 'guest') {
    return raw
  }
  if (typeof raw === 'object' && typeof raw.user_id === 'string' && raw.user_id !== '') {
    return { user_id: raw.user_id }
  }
  throw new HttpsError('invalid-argument', 'actor_filter is invalid')
}

async function buildDisplayContext(
  enterpriseId: string,
  logs: AuditLog[],
): Promise<{
  memberDisplayNames: Map<string, string>
  communityNames: Map<string, string>
  eventNames: Map<string, string>
  enterpriseName: string
}> {
  const [members, enterprise] = await Promise.all([
    listEnterpriseMembers(enterpriseId),
    getEnterpriseById(enterpriseId),
  ])

  const memberDisplayNames = new Map(members.map((m) => [m.user_id, m.display_name ?? m.user_id]))
  const communityNames = new Map<string, string>()
  const eventRefs: { community_id: string; event_id: string }[] = []

  const communityIds = new Set<string>()
  for (const log of logs) {
    if (log.target_type === 'community' && log.target_id != null && log.target_id !== '') {
      communityIds.add(log.target_id)
    }
    if (log.target_type === 'event' && log.target_id != null && log.target_id !== '') {
      const communityId = typeof log.details?.community_id === 'string' ? log.details.community_id : undefined
      if (communityId != null) {
        eventRefs.push({ community_id: communityId, event_id: log.target_id })
      }
    }
  }

  const [communitiesById, eventsByKey] = await Promise.all([
    getCommunitiesByIds(Array.from(communityIds)),
    getEventsInCommunities(eventRefs),
  ])
  for (const [communityId, community] of communitiesById) {
    if (community.enterprise_id !== enterpriseId) {
      continue
    }
    communityNames.set(communityId, community.community_name)
  }
  const eventNames = new Map<string, string>()
  for (const ref of eventRefs) {
    const event = eventsByKey.get(getCommunityEventKey(ref.community_id, ref.event_id))
    if (event != null) {
      eventNames.set(ref.event_id, event.event_name)
    }
  }

  return {
    memberDisplayNames,
    communityNames,
    eventNames,
    enterpriseName: enterprise?.company_name ?? '',
  }
}

export async function enrichAuditLogItems(enterpriseId: string, logs: AuditLog[]): Promise<AuditLogListItem[]> {
  const context = await buildDisplayContext(enterpriseId, logs)
  return logs.map((log) => {
    const details = log.details ?? null
    const isGuest = isAuditLogGuest(details)
    return {
      log_id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      user_id: log.user_id,
      operator_label: buildAuditLogOperatorLabel({
        userId: log.user_id,
        details,
        memberDisplayNames: context.memberDisplayNames,
        systemLabel: DISPLAY_LABELS.system,
        guestSuffix: DISPLAY_LABELS.guestSuffix,
      }),
      target_type: log.target_type ?? null,
      target_id: log.target_id ?? null,
      target_label: buildAuditLogTargetLabel({
        targetType: log.target_type,
        targetId: log.target_id,
        details,
        context,
        labels: DISPLAY_LABELS,
      }),
      details,
      is_guest: isGuest,
    }
  })
}

function handleQueryError(error: unknown): never {
  if (error instanceof AuditLogQueryError) {
    throw new HttpsError('invalid-argument', error.message)
  }
  throw error
}

export const getEnterpriseAuditLogs = onCall<GetEnterpriseAuditLogsRequest, Promise<GetEnterpriseAuditLogsResponse>>(
  async (request) => {
    const { enterprise_id: enterpriseId } = request.data
    await assertEnterpriseAdmin(request.auth, enterpriseId)

    try {
      const actorFilter = parseActorFilter(request.data.actor_filter)
      const decodedCursor =
        request.data.cursor != null && request.data.cursor !== ''
          ? decodeAuditLogCursor(request.data.cursor)
          : undefined
      if (request.data.cursor != null && request.data.cursor !== '' && decodedCursor == null) {
        throw new HttpsError('invalid-argument', 'cursor is invalid')
      }

      const { logs, hasNext, nextCursor } = await listAuditLogs({
        enterpriseId,
        action: request.data.action,
        actorFilter,
        startDate: request.data.start_date,
        endDate: request.data.end_date,
        pageSize: request.data.page_size,
        cursor: decodedCursor,
      })

      const items = await enrichAuditLogItems(enterpriseId, logs)
      return {
        items,
        has_next: hasNext,
        next_cursor: nextCursor != null ? encodeAuditLogCursor(nextCursor) : undefined,
      }
    } catch (error) {
      handleQueryError(error)
    }
  },
)
