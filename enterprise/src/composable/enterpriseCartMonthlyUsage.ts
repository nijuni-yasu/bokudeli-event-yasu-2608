import { doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '@shokujii/base/firebase.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import type { CartMonthlyUsageLoader } from '@shokujii/base/composable/cartMonthlyUsage.js'

/** enterprise 版カート: ログインユーザーの月次 usage を Firestore から取得 */
export const enterpriseCartMonthlyUsageLoader: CartMonthlyUsageLoader = async (userId) => {
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
    const [memberSnap, enterpriseSnap] = await Promise.all([
      getDoc(doc(db, 'enterprises', enterpriseId, 'members', userId)),
      getDoc(doc(db, 'enterprises', enterpriseId)),
    ])
    if (!memberSnap.exists() || !enterpriseSnap.exists()) {
      return null
    }
    const member = new EnterpriseMember(userId, memberSnap.data())
    const enterprise = new Enterprise(enterpriseId, enterpriseSnap.data())
    const month = formatYearMonth(Date.now())
    const limit = enterprise.monthly_limit_per_user
    if (typeof limit !== 'number') {
      return null
    }
    return {
      used: member.monthly_usage[month] ?? 0,
      limit,
    }
  } catch (error) {
    console.warn('Failed to load monthly usage', error)
    return null
  }
}
