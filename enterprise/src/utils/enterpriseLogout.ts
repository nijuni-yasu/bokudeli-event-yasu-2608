import { getAuth } from 'firebase/auth'
import { logEnterpriseLogout } from '@/apis/enterprise'

export async function performEnterpriseLogout(action: 'logout' | 'session_timeout'): Promise<void> {
  const user = getAuth().currentUser
  if (user != null) {
    const tokenResult = await user.getIdTokenResult()
    const enterpriseId = tokenResult.claims.enterprise_id as string | undefined
    if (enterpriseId != null) {
      try {
        await logEnterpriseLogout({ enterprise_id: enterpriseId, action })
      } catch {
        // 監査ログ失敗時は握りつぶしてログアウトを継続
      }
    }
  }
  await getAuth().signOut()
}
