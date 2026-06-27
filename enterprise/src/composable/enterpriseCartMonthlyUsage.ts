import type { CartMonthlyUsageLoader } from '@shokujii/base/composable/cartMonthlyUsage.js'
import { fetchEnterpriseMemberMonthlyUsage } from './enterpriseMemberMonthlyUsage.js'

/** enterprise 版カート: ログインユーザーの月次 usage を Firestore から取得 */
export const enterpriseCartMonthlyUsageLoader: CartMonthlyUsageLoader = async (userId) => {
  const view = await fetchEnterpriseMemberMonthlyUsage(userId)
  if (view == null) {
    return null
  }
  return {
    used: view.used,
    limit: view.limit,
  }
}
