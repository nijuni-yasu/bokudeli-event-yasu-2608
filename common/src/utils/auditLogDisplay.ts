import type { AuditLogTargetType } from '../schemas/AuditLog.js'

export type AuditLogDisplayContext = {
  memberDisplayNames: ReadonlyMap<string, string>
  communityNames: ReadonlyMap<string, string>
  eventNames: ReadonlyMap<string, string>
  enterpriseName: string
}

const SYSTEM_USER_ID = 'system'

export function isAuditLogGuest(details: Record<string, unknown> | null | undefined): boolean {
  return details?.is_guest === true
}

export function buildAuditLogOperatorLabel(params: {
  userId: string
  details?: Record<string, unknown> | null
  memberDisplayNames: ReadonlyMap<string, string>
  systemLabel: string
  guestSuffix: string
}): string {
  const { userId, details, memberDisplayNames, systemLabel, guestSuffix } = params
  let label: string
  if (userId === SYSTEM_USER_ID) {
    label = systemLabel
  } else {
    label = memberDisplayNames.get(userId) ?? userId
  }
  if (isAuditLogGuest(details)) {
    label = `${label}${guestSuffix}`
  }
  return label
}

export function buildAuditLogTargetLabel(params: {
  targetType?: AuditLogTargetType | string | null
  targetId?: string | null
  details?: Record<string, unknown> | null
  context: AuditLogDisplayContext
  labels: {
    settings: string
    enterpriseSubsidySettings: string
    orderSession: (count: number) => string
    fallback: string
  }
}): string {
  const { targetType, targetId, details, context, labels } = params

  switch (targetType) {
    case 'member':
      return targetId != null && targetId !== ''
        ? (context.memberDisplayNames.get(targetId) ?? targetId)
        : labels.fallback
    case 'community':
      if (targetId != null && targetId !== '') {
        const fromMap = context.communityNames.get(targetId)
        if (fromMap != null) {
          return fromMap
        }
      }
      if (typeof details?.community_name === 'string' && details.community_name !== '') {
        return details.community_name
      }
      return targetId != null && targetId !== '' ? targetId : labels.fallback
    case 'order_session': {
      const orderIds = details?.order_ids
      const count = Array.isArray(orderIds) ? orderIds.length : 0
      return labels.orderSession(count)
    }
    case 'settings':
      return labels.settings
    case 'enterprise_subsidy_settings':
      return labels.enterpriseSubsidySettings
    case 'event': {
      const eventId = targetId ?? (typeof details?.event_id === 'string' ? details.event_id : undefined)
      if (eventId == null || eventId === '') {
        return labels.fallback
      }
      return context.eventNames.get(eventId) ?? eventId
    }
    case 'enterprise':
      return context.enterpriseName !== '' ? context.enterpriseName : labels.fallback
    default:
      if (targetId != null && targetId !== '') {
        return targetId
      }
      return labels.fallback
  }
}
