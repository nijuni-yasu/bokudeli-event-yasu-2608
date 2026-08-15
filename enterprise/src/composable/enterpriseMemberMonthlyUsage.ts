import { getAuth } from 'firebase/auth'
import { getEnterpriseById, getEnterpriseMemberById } from '@shokujii/base/stores/enterprise.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import type { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { resolveEnterpriseSubsidySettingsForMonthOrNull } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import {
  toEnterpriseMemberMonthlyUsageView,
  type EnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'

export type {
  EnterpriseMemberMonthlyUsageHistoryRow,
  EnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'
export {
  applyBudgetColumnsToHistory,
  buildMonthlyUsageHistory,
  compareYearMonth,
  formatYearMonthLabel,
  toEnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'

async function resolveEnterpriseIdForUser(userId: string): Promise<string | null> {
  const auth = getAuth()
  const user = auth.currentUser
  if (user == null || user.uid !== userId) {
    return null
  }
  const token = await user.getIdTokenResult()
  const enterpriseId = token.claims.enterprise_id
  if (typeof enterpriseId !== 'string' || enterpriseId === '') {
    return null
  }
  return enterpriseId
}

async function loadEnterpriseForCurrentUser(
  userId: string,
): Promise<{ enterpriseId: string; enterprise: Enterprise } | null> {
  const enterpriseId = await resolveEnterpriseIdForUser(userId)
  if (enterpriseId == null) {
    return null
  }
  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    return null
  }
  return { enterpriseId, enterprise }
}

async function loadEnterpriseMemberContext(
  userId: string,
): Promise<{ enterpriseId: string; member: EnterpriseMember; enterprise: Enterprise } | null> {
  const enterpriseId = await resolveEnterpriseIdForUser(userId)
  if (enterpriseId == null) {
    return null
  }
  const [member, enterprise] = await Promise.all([
    getEnterpriseMemberById(enterpriseId, userId),
    getEnterpriseById(enterpriseId),
  ])
  if (member == null || enterprise == null) {
    return null
  }
  return { enterpriseId, member, enterprise }
}

/** 利用状況タブ表示可否（subsidy_settings_history が 1 件以上あり、当月 resolve 可能） */
export async function fetchEnterpriseUsageTabEligible(userId: string): Promise<boolean> {
  try {
    const loaded = await loadEnterpriseForCurrentUser(userId)
    if (loaded == null || loaded.enterprise.subsidy_settings_history.length === 0) {
      return false
    }
    return (
      resolveEnterpriseSubsidySettingsForMonthOrNull(
        loaded.enterprise.subsidy_settings_history,
        formatYearMonth(Date.now()),
      ) != null
    )
  } catch (error) {
    console.warn('Failed to check enterprise usage tab eligibility', error)
    reportClientError(error, { componentInfo: 'enterpriseMemberMonthlyUsage', severity: 'warn' })
    return false
  }
}

/** enterprise 版: ログインユーザーの月次 usage（カート・利用状況タブ共用） */
export async function fetchEnterpriseMemberMonthlyUsage(
  userId: string,
): Promise<EnterpriseMemberMonthlyUsageView | null> {
  try {
    const loaded = await loadEnterpriseMemberContext(userId)
    if (loaded == null || loaded.enterprise.subsidy_settings_history.length === 0) {
      return null
    }
    const currentMonth = formatYearMonth(Date.now())
    return toEnterpriseMemberMonthlyUsageView(loaded.member, loaded.enterprise.subsidy_settings_history, currentMonth)
  } catch (error) {
    console.warn('Failed to load enterprise member monthly usage', error)
    reportClientError(error, { componentInfo: 'enterpriseMemberMonthlyUsage', severity: 'warn' })
    return null
  }
}
