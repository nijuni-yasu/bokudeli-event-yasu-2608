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
