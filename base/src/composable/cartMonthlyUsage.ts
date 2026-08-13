export type CartMonthlyUsage = {
  used: number
  limit: number
}

export type CartMonthlyUsageLoader = (userId: string) => Promise<CartMonthlyUsage | null>

/** ローダー結果を表示可能な形に正規化する（不完全オブジェクトは null） */
export function normalizeCartMonthlyUsage(value: unknown): CartMonthlyUsage | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const { used, limit } = value as CartMonthlyUsage
  if (typeof used !== 'number' || typeof limit !== 'number') {
    return null
  }
  return { used, limit }
}

/** PF 版: 月次 usage 表示なし */
export const pfCartMonthlyUsageLoader: CartMonthlyUsageLoader = async () => null

/** 福利厚生: 開催月 bucket ごとの確定済み利用額（EnterpriseMember.monthly_usage） */
export type CartEnterpriseSubsidyBudget = {
  monthlyUsage: Record<string, number>
}

export type CartEnterpriseSubsidyBudgetLoader = (userId: string) => Promise<CartEnterpriseSubsidyBudget | null>

export function normalizeCartEnterpriseSubsidyBudget(value: unknown): CartEnterpriseSubsidyBudget | null {
  if (typeof value !== 'object' || value === null || !('monthlyUsage' in value)) {
    return null
  }
  const { monthlyUsage } = value
  if (typeof monthlyUsage !== 'object' || monthlyUsage === null) {
    return null
  }
  const normalized: Record<string, number> = {}
  for (const [key, entry] of Object.entries(monthlyUsage)) {
    if (typeof entry !== 'number' || Number.isNaN(entry)) {
      return null
    }
    normalized[key] = entry
  }
  return { monthlyUsage: normalized }
}

/** PF / user 版: 福利厚生 budget なし */
export const pfCartEnterpriseSubsidyBudgetLoader: CartEnterpriseSubsidyBudgetLoader = async () => null
