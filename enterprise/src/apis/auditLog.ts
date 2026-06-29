import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import type { GetEnterpriseAuditLogsRequest, GetEnterpriseAuditLogsResponse } from '@shokujii/common/apis/auditLog.js'

export const getEnterpriseAuditLogs = async (input: GetEnterpriseAuditLogsRequest) => {
  const f = httpsCallable<GetEnterpriseAuditLogsRequest, GetEnterpriseAuditLogsResponse>(
    functions,
    'getEnterpriseAuditLogs',
  )
  return f(input)
}
