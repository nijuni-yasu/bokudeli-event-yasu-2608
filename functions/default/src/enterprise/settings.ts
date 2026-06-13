import { onCall, HttpsError } from 'firebase-functions/https'
import { UpdateEnterpriseSettingsRequest, UpdateEnterpriseSettingsResponse } from '@shokujii/common/apis/enterprise.js'
import { getEnterpriseById, saveEnterprise } from '../stores/enterprise.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { assertEnterpriseAdmin, getClientIp } from '../utils/enterpriseAuthHelpers.js'
import { assertEnterpriseLogoUrl } from './enterpriseLogoUrl.js'

export const updateEnterpriseSettings = onCall<
  UpdateEnterpriseSettingsRequest,
  Promise<UpdateEnterpriseSettingsResponse>
>(async (request) => {
  assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
  const uid = request.auth.uid
  const { enterprise_id: enterpriseId, company_name: companyName, company_logo_url: companyLogoUrl } = request.data

  if (companyName == null && companyLogoUrl == null) {
    throw new HttpsError('invalid-argument', 'nothing to update')
  }
  if (companyName != null && companyName.trim() === '') {
    throw new HttpsError('invalid-argument', 'company_name is required')
  }
  if (companyLogoUrl != null) {
    assertEnterpriseLogoUrl(enterpriseId, companyLogoUrl)
  }

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  const details: Record<string, { old: unknown; new: unknown }> = {}

  if (companyName != null) {
    details.company_name = { old: enterprise.company_name, new: companyName.trim() }
    enterprise.company_name = companyName.trim()
  }
  if (companyLogoUrl != null) {
    details.company_logo_url = { old: enterprise.company_logo_url, new: companyLogoUrl }
    enterprise.company_logo_url = companyLogoUrl
  }

  await saveEnterprise(enterprise)

  await writeAuditLog({
    enterpriseId,
    userId: uid,
    action: 'settings_update',
    targetId: enterpriseId,
    targetType: 'settings',
    ipAddress: getClientIp(request.rawRequest),
    details,
  })

  return { success: true }
})
