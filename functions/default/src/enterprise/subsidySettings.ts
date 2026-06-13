import { onCall, HttpsError } from 'firebase-functions/https'
import {
  UpdateEnterpriseSubsidySettingsRequest,
  UpdateEnterpriseSubsidySettingsResponse,
} from '@shokujii/common/apis/enterprise.js'
import { getEnterpriseById, saveEnterprise } from '../stores/enterprise.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { assertEnterpriseAdmin, getClientIp } from '../utils/enterpriseAuthHelpers.js'
import { validateSubsidySettings } from './subsidyValidation.js'

export const updateEnterpriseSubsidySettings = onCall<
  UpdateEnterpriseSubsidySettingsRequest,
  Promise<UpdateEnterpriseSubsidySettingsResponse>
>(async (request) => {
  assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
  const uid = request.auth.uid
  const {
    enterprise_id: enterpriseId,
    discount_type: discountType,
    discount_value: discountValue,
    monthly_limit_per_user: monthlyLimitPerUser,
  } = request.data

  if (discountType == null || discountValue == null || monthlyLimitPerUser == null) {
    throw new HttpsError('invalid-argument', 'subsidy settings are incomplete')
  }

  validateSubsidySettings(discountType, discountValue, monthlyLimitPerUser)

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  const details = {
    discount_type: { old: enterprise.discount_type, new: discountType },
    discount_value: { old: enterprise.discount_value, new: discountValue },
    monthly_limit_per_user: { old: enterprise.monthly_limit_per_user, new: monthlyLimitPerUser },
  }

  enterprise.discount_type = discountType
  enterprise.discount_value = discountValue
  enterprise.monthly_limit_per_user = monthlyLimitPerUser
  await saveEnterprise(enterprise)

  await writeAuditLog({
    enterpriseId,
    userId: uid,
    action: 'discount_update',
    targetId: enterpriseId,
    targetType: 'enterprise_subsidy_settings',
    ipAddress: getClientIp(request.rawRequest),
    details,
  })

  return { success: true }
})
