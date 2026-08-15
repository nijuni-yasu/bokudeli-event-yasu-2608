import type { EnterpriseSubsidySettingsEntryType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { EnterpriseSubsidySettingsEntryAppSchema } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'

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
  subsidySettingsHistory: EnterpriseSubsidySettingsEntryType[]
}

export type CartEnterpriseSubsidyBudgetLoader = (userId: string) => Promise<CartEnterpriseSubsidyBudget | null>

function isSubsidySettingsHistoryEntry(value: unknown): value is EnterpriseSubsidySettingsEntryType {
  return EnterpriseSubsidySettingsEntryAppSchema.safeParse(value).success
}

export function normalizeCartEnterpriseSubsidyBudget(value: unknown): CartEnterpriseSubsidyBudget | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('monthlyUsage' in value) ||
    !('subsidySettingsHistory' in value)
  ) {
    return null
  }
  const { monthlyUsage, subsidySettingsHistory } = value
  if (typeof monthlyUsage !== 'object' || monthlyUsage === null || !Array.isArray(subsidySettingsHistory)) {
    return null
  }
  const normalizedUsage: Record<string, number> = {}
  for (const [key, entry] of Object.entries(monthlyUsage)) {
    if (typeof entry !== 'number' || Number.isNaN(entry)) {
      return null
    }
    normalizedUsage[key] = entry
  }
  if (!subsidySettingsHistory.every(isSubsidySettingsHistoryEntry)) {
    return null
  }
  if (subsidySettingsHistory.length === 0) {
    return null
  }
  return { monthlyUsage: normalizedUsage, subsidySettingsHistory }
}

/** PF / user 版: 福利厚生 budget なし */
export const pfCartEnterpriseSubsidyBudgetLoader: CartEnterpriseSubsidyBudgetLoader = async () => null

/** loader 結果を正規化して返す（watch / 再計算後 reload 共通） */
export async function fetchCartEnterpriseSubsidyBudget(
  userId: string,
  loader: CartEnterpriseSubsidyBudgetLoader,
): Promise<CartEnterpriseSubsidyBudget | null> {
  if (userId === '') {
    return null
  }
  try {
    const result = await loader(userId)
    return normalizeCartEnterpriseSubsidyBudget(result)
  } catch {
    return null
  }
}
