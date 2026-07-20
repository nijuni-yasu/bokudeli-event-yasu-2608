import { getAuth } from 'firebase/auth'
import { getEnterpriseById, getEnterpriseMemberById } from '@shokujii/base/stores/enterprise.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import {
  toEnterpriseMemberMonthlyUsageView,
  type EnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'

export type {
  EnterpriseMemberMonthlyUsageHistoryRow,
  EnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'
export { buildMonthlyUsageHistory, toEnterpriseMemberMonthlyUsageView } from './enterpriseMemberMonthlyUsageHistory.js'

/** 利用状況タブ表示可否（monthly_limit_per_user が設定されているか） */
export async function fetchEnterpriseUsageTabEligible(userId: string): Promise<boolean> {
  const view = await fetchEnterpriseMemberMonthlyUsage(userId)
  return view != null
}

/** enterprise 版: ログインユーザーの月次 usage（カート・利用状況タブ共用） */
export async function fetchEnterpriseMemberMonthlyUsage(
  userId: string,
): Promise<EnterpriseMemberMonthlyUsageView | null> {
  const auth = getAuth()
  const user = auth.currentUser
  if (user == null || user.uid !== userId) {
    return null
  }
  try {
    const token = await user.getIdTokenResult()
    const enterpriseId = token.claims.enterprise_id as string | undefined
    if (enterpriseId == null || enterpriseId === '') {
      return null
    }
    const [member, enterprise] = await Promise.all([
      getEnterpriseMemberById(enterpriseId, userId),
      getEnterpriseById(enterpriseId),
    ])
    if (member == null || enterprise == null) {
      return null
    }
    const limit = enterprise.monthly_limit_per_user
    if (typeof limit !== 'number') {
      return null
    }
    const currentMonth = formatYearMonth(Date.now())
    return toEnterpriseMemberMonthlyUsageView(member, limit, currentMonth)
  } catch (error) {
    console.warn('Failed to load enterprise member monthly usage', error)
    return null
  }
}
