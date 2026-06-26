import { onCall, HttpsError } from 'firebase-functions/https'
import { LogEnterpriseLogoutRequest, LogEnterpriseLogoutResponse } from '@shokujii/common/apis/enterprise.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { getClientIp } from '../utils/enterpriseAuthHelpers.js'

export const logEnterpriseLogout = onCall<LogEnterpriseLogoutRequest, Promise<LogEnterpriseLogoutResponse>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', 'not logged in')
    }

    const { enterprise_id: enterpriseId, action } = request.data
    if (enterpriseId == null || action == null) {
      throw new HttpsError('invalid-argument', 'enterprise_id or action is missing')
    }
    if (action !== 'logout' && action !== 'session_timeout') {
      throw new HttpsError('invalid-argument', 'invalid action')
    }

    const tokenEnterpriseId = request.auth?.token.enterprise_id as string | undefined
    if (tokenEnterpriseId == null || tokenEnterpriseId !== enterpriseId) {
      throw new HttpsError('permission-denied', 'enterprise_id mismatch')
    }

    await writeAuditLog({
      enterpriseId,
      userId: uid,
      action,
      ipAddress: getClientIp(request.rawRequest),
    })

    return { success: true }
  },
)
