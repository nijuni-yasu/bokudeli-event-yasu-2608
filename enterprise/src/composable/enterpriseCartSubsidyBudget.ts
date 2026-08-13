import { getAuth } from 'firebase/auth'
import type { CartEnterpriseSubsidyBudgetLoader } from '@shokujii/base/composable/cartMonthlyUsage.js'
import { getEnterpriseMemberById } from '@shokujii/base/stores/enterprise.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'

/** enterprise 版カート: 開催月別の確定済み usage（member.monthly_usage） */
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
    const member = await getEnterpriseMemberById(enterpriseId, userId)
    if (member == null) {
      return null
    }
    return { monthlyUsage: member.monthly_usage ?? {} }
  } catch (error) {
    console.warn('[cart] enterpriseCartSubsidyBudgetLoader failed', error)
    reportClientError(error, { componentInfo: 'enterpriseCartSubsidyBudget', severity: 'warn' })
    return null
  }
}
