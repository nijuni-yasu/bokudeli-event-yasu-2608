import { onCall, HttpsError } from 'firebase-functions/https'
import {
  UpdateEnterpriseSubsidySettingsRequest,
  UpdateEnterpriseSubsidySettingsResponse,
} from '@shokujii/common/apis/enterprise.js'
import type { EnterpriseSubsidySettingsEntryType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { resolveEnterpriseSubsidySettingsForMonthOrNull } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import { getEnterpriseById, saveEnterprise } from '../stores/enterprise.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { assertEnterpriseAdmin, getClientIp } from '../utils/enterpriseAuthHelpers.js'
import { assertEffectiveFromMonthIsFuture, validateSubsidySettings } from './subsidyValidation.js'

export const updateEnterpriseSubsidySettings = onCall<
  UpdateEnterpriseSubsidySettingsRequest,
  Promise<UpdateEnterpriseSubsidySettingsResponse>
>(async (request) => {
  await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
  const uid = request.auth!.uid
  const {
    enterprise_id: enterpriseId,
    effective_from_month: effectiveFromMonth,
    discount_type: discountType,
    discount_value: discountValue,
    monthly_limit_per_user: monthlyLimitPerUser,
  } = request.data

  if (effectiveFromMonth == null || discountType == null || discountValue == null || monthlyLimitPerUser == null) {
    throw new HttpsError('invalid-argument', 'subsidy settings are incomplete')
  }

  assertEffectiveFromMonthIsFuture(effectiveFromMonth)
  validateSubsidySettings(discountType, discountValue, monthlyLimitPerUser)

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  // 履歴が空（初回設定）は正当な状態のため、監査ログの old 値は null とする
  const previousSettings = resolveEnterpriseSubsidySettingsForMonthOrNull(
    enterprise.subsidy_settings_history,
    effectiveFromMonth,
  )

  const newEntry: EnterpriseSubsidySettingsEntryType = {
    effective_from_month: effectiveFromMonth,
    type: discountType,
    value: discountValue,
    monthly_limit_per_user: monthlyLimitPerUser,
  }

  const historyWithoutTarget = enterprise.subsidy_settings_history.filter(
    (entry) => entry.effective_from_month !== effectiveFromMonth,
  )
  enterprise.subsidy_settings_history = [...historyWithoutTarget, newEntry].sort((a, b) =>
    a.effective_from_month.localeCompare(b.effective_from_month),
  )
  await saveEnterprise(enterprise)

  const details = {
    effective_from_month: effectiveFromMonth,
    type: { old: previousSettings?.type ?? null, new: discountType },
    value: { old: previousSettings?.value ?? null, new: discountValue },
    monthly_limit_per_user: { old: previousSettings?.monthly_limit_per_user ?? null, new: monthlyLimitPerUser },
  }

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
