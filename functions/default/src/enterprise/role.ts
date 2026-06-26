import { onCall, HttpsError } from 'firebase-functions/https'
import { UpdateEnterpriseRoleRequest, UpdateEnterpriseRoleResponse } from '@shokujii/common/apis/enterprise.js'
import { ENTERPRISE_MEMBER_ROLE_VALUES } from '@shokujii/common/schemas/Enterprise.js'
import { countActiveEnterpriseAdmins, getEnterpriseMember, saveEnterpriseMember } from '../stores/enterprise.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { assertEnterpriseAdmin, getClientIp } from '../utils/enterpriseAuthHelpers.js'
import { authForEnterprise } from '../utils/tenantAuth.js'

export const updateEnterpriseRole = onCall<UpdateEnterpriseRoleRequest, Promise<UpdateEnterpriseRoleResponse>>(
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const uid = request.auth!.uid
    const { enterprise_id: enterpriseId, user_id: userId, role: newRole } = request.data

    if (userId == null || newRole == null) {
      throw new HttpsError('invalid-argument', 'user_id and role are required')
    }
    if (!ENTERPRISE_MEMBER_ROLE_VALUES.includes(newRole)) {
      throw new HttpsError('invalid-argument', 'invalid role')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'member not found')
    }

    const oldRole = member.role
    if (oldRole === 'admin' && newRole === 'member' && member.is_active) {
      const otherActiveAdmins = await countActiveEnterpriseAdmins(enterpriseId, userId)
      if (otherActiveAdmins === 0) {
        throw new HttpsError('failed-precondition', '最低1人の管理者が必要です')
      }
    }

    const tenantAuth = await authForEnterprise(enterpriseId)
    const userRecord = await tenantAuth.getUser(userId)
    const existingClaims = userRecord.customClaims ?? {}
    await tenantAuth.setCustomUserClaims(userId, {
      ...existingClaims,
      enterprise_role: newRole,
    })
    if (oldRole === 'admin' && newRole !== 'admin') {
      await tenantAuth.revokeRefreshTokens(userId)
    }

    member.role = newRole
    await saveEnterpriseMember(member, enterpriseId)

    await writeAuditLog({
      enterpriseId,
      userId: uid,
      action: 'role_change',
      targetId: userId,
      targetType: 'member',
      ipAddress: getClientIp(request.rawRequest),
      details: { old_role: oldRole, new_role: newRole },
    })

    return { success: true }
  },
)
