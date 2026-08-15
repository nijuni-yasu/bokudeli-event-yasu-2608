import { getAuth } from 'firebase/auth'
import type { CartEnterpriseSubsidyBudgetLoader } from '@shokujii/base/composable/cartMonthlyUsage.js'
import { getEnterpriseById, getEnterpriseMemberById } from '@shokujii/base/stores/enterprise.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'

/** enterprise 版カート: 開催月別の確定済み usage と補助設定履歴 */
export const enterpriseCartSubsidyBudgetLoader: CartEnterpriseSubsidyBudgetLoader = async (userId) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (user == null || user.uid !== userId) {
    return null
  }
  try {
    const token = await user.getIdTokenResult()
    const enterpriseId = token.claims.enterprise_id
    if (typeof enterpriseId !== 'string' || enterpriseId === '') {
      return null
    }
    const [member, enterprise] = await Promise.all([
      getEnterpriseMemberById(enterpriseId, userId),
      getEnterpriseById(enterpriseId),
    ])
    if (member == null || enterprise == null || enterprise.subsidy_settings_history.length === 0) {
      return null
    }
    return {
      monthlyUsage: member.monthly_usage ?? {},
      subsidySettingsHistory: enterprise.subsidy_settings_history,
    }
  } catch (error) {
    console.warn('[cart] enterpriseCartSubsidyBudgetLoader failed', error)
    reportClientError(error, { componentInfo: 'enterpriseCartSubsidyBudget', severity: 'warn' })
    return null
  }
}
