import { AuditLog, type AuditLogTargetType } from '@shokujii/common/schemas/AuditLog.js'
import { saveAuditLog } from '../stores/enterprise.js'
import { createModuleLogger } from './logger.js'

const logger = createModuleLogger('auditLog')

export type WriteAuditLogParams = {
  enterpriseId: string
  userId: string
  action: string
  targetId?: string | null
  targetType?: AuditLogTargetType | null
  ipAddress?: string | null
  details?: Record<string, unknown> | null
}

/**
 * 監査ログ書き込み（ベストエフォート）。失敗しても呼び出し元の本体処理は fail させない。
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const log = new AuditLog('', {
    enterprise_id: params.enterpriseId,
    user_id: params.userId,
    action: params.action,
    target_id: params.targetId ?? null,
    target_type: params.targetType ?? null,
    ip_address: params.ipAddress ?? null,
    details: params.details ?? null,
  })

  try {
    const logId = await saveAuditLog(params.enterpriseId, log)
    logger.info('audit_log_written', {
      logId,
      enterpriseId: params.enterpriseId,
      action: params.action,
      userId: params.userId,
    })
  } catch (error) {
    logger.error('audit_log_write_failed', {
      enterpriseId: params.enterpriseId,
      action: params.action,
      userId: params.userId,
      error,
    })
  }
}
