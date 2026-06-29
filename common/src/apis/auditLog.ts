export type AuditLogActorFilter = 'all' | 'system' | 'guest' | { user_id: string }

export type GetEnterpriseAuditLogsRequest = {
  enterprise_id: string
  action?: string
  actor_filter?: AuditLogActorFilter
  start_date?: string
  end_date?: string
  page_size?: number
  cursor?: string
}

export type AuditLogListItem = {
  log_id: string
  timestamp: number
  action: string
  user_id: string
  operator_label: string
  target_type?: string | null
  target_id?: string | null
  target_label: string
  details?: Record<string, unknown> | null
  is_guest: boolean
}

export type GetEnterpriseAuditLogsResponse = {
  items: AuditLogListItem[]
  has_next: boolean
  next_cursor?: string
}

export type AuditLogCursor = {
  timestamp: number
  log_id: string
}
