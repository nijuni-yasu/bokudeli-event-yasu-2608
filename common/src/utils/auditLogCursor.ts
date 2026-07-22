import { DateTime } from 'luxon'
import type { AuditLogCursor } from '../apis/auditLog.js'
import { DEFAULT_TIME_ZONE } from './datetime.js'

export class AuditLogQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuditLogQueryError'
  }
}

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

export function encodeAuditLogCursor(cursor: AuditLogCursor): string {
  return encodeBase64Url(JSON.stringify(cursor))
}

export function decodeAuditLogCursor(encoded: string): AuditLogCursor | undefined {
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(encoded))
    if (typeof parsed === 'object' && parsed != null && 'timestamp' in parsed && 'log_id' in parsed) {
      const { timestamp, log_id: logId } = parsed
      if (typeof timestamp === 'number' && typeof logId === 'string' && logId !== '') {
        return { timestamp, log_id: logId }
      }
    }
  } catch {
    // invalid cursor
  }
  return undefined
}

export function parseAuditLogDateRange(
  startDate?: string,
  endDate?: string,
  zone = DEFAULT_TIME_ZONE,
): { startMillis?: number; endMillis?: number } {
  let startMillis: number | undefined
  let endMillis: number | undefined

  if (startDate != null && startDate !== '') {
    const dt = DateTime.fromFormat(startDate, 'yyyy-MM-dd', { zone })
    if (!dt.isValid) {
      throw new AuditLogQueryError('start_date format is invalid')
    }
    startMillis = dt.startOf('day').toMillis()
  }

  if (endDate != null && endDate !== '') {
    const dt = DateTime.fromFormat(endDate, 'yyyy-MM-dd', { zone })
    if (!dt.isValid) {
      throw new AuditLogQueryError('end_date format is invalid')
    }
    endMillis = dt.endOf('day').toMillis()
  }

  if (startMillis != null && endMillis != null && startMillis > endMillis) {
    throw new AuditLogQueryError('start_date must be before or equal to end_date')
  }

  return { startMillis, endMillis }
}

export const DEFAULT_AUDIT_LOG_PAGE_SIZE = 50
export const MAX_AUDIT_LOG_PAGE_SIZE = 50
export const GUEST_FILTER_SCAN_MULTIPLIER = 5

export function normalizeAuditLogPageSize(pageSize?: number): number {
  const size = pageSize ?? DEFAULT_AUDIT_LOG_PAGE_SIZE
  return Math.min(Math.max(1, size), MAX_AUDIT_LOG_PAGE_SIZE)
}
