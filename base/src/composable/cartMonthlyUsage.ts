export type CartMonthlyUsage = {
  used: number
  limit: number
}

export type CartMonthlyUsageLoader = (userId: string) => Promise<CartMonthlyUsage | null>

/** PF 版: 月次 usage 表示なし */
export const pfCartMonthlyUsageLoader: CartMonthlyUsageLoader = async () => null
