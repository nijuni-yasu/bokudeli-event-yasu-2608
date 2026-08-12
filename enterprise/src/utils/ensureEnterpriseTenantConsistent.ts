import type { User } from 'firebase/auth'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useEnterpriseStore } from '@/stores/enterprise'
import { isEnterpriseAuthTenantConsistent, setEnterpriseAuthTenantId } from '@/utils/enterpriseAuth'
import { readCachedEnterpriseTenantEntry, writeEnterpriseTenantCache } from '@/utils/enterpriseTenantCache'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** resolved enterprise または hostname キャッシュから auth.tenantId を同期設定する */
export function applyKnownEnterpriseAuthTenantId(): void {
  const enterpriseStore = useEnterpriseStore()
  const resolvedTenantId = enterpriseStore.enterprise?.tenant_id
  if (resolvedTenantId != null && resolvedTenantId !== '') {
    setEnterpriseAuthTenantId(resolvedTenantId)
    return
  }
  const cached = readCachedEnterpriseTenantEntry()
  if (cached != null) {
    setEnterpriseAuthTenantId(cached.tenant_id)
  }
}

/**
 * テナント bootstrap 後の Auth 状態を待つ。
 * キャッシュ tenant ありで初回 null のときのみ永続化復元を最大 2 秒待つ（以降のナビゲーションでは即 null）。
 * 同一ナビゲーション内の複数 beforeEach から呼ばれても待機は 1 回にまとめる。
 */
let pendingAuthWait: Promise<User | null> | null = null
/** セッション内で初回 waitEnterpriseAuthentication が完了したら true（RC-84） */
let authRestoreGraceConsumed = false

export function waitEnterpriseAuthentication(): Promise<User | null> {
  if (pendingAuthWait != null) {
    return pendingAuthWait
  }

  applyKnownEnterpriseAuthTenantId()
  const hasCache = readCachedEnterpriseTenantEntry() != null

  pendingAuthWait = new Promise((resolve) => {
    const auth = getAuth()
    let settled = false
    let unsubscribe: (() => void) | undefined

    const finish = (user: User | null) => {
      if (settled) {
        return
      }
      settled = true
      authRestoreGraceConsumed = true
      unsubscribe?.()
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
      resolve(user)
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (hasCache && !authRestoreGraceConsumed) {
      timeoutId = setTimeout(() => finish(auth.currentUser), 2000)
    }

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user != null) {
        finish(user)
        return
      }
      if (!hasCache || authRestoreGraceConsumed) {
        finish(null)
      }
    })
  })

  void pendingAuthWait.finally(() => {
    pendingAuthWait = null
  })

  return pendingAuthWait
}

function parseTokenEnterpriseId(claims: Record<string, unknown>): string | undefined {
  const raw = claims.enterprise_id
  return typeof raw === 'string' ? raw : undefined
}

function isEnterpriseEmployeeClaims(claims: Record<string, unknown>): boolean {
  return claims.user_type === 'enterprise'
}

/**
 * 従業員 token と resolved enterprise の tenant 整合を確認する（リトライ付き）。
 * enterprise 従業員でない場合は true（ガード対象外）。
 */
export async function ensureEnterpriseTenantConsistent(user: User): Promise<boolean> {
  let tokenResult = await user.getIdTokenResult()
  if (!isEnterpriseEmployeeClaims(tokenResult.claims)) {
    return true
  }

  const enterpriseStore = useEnterpriseStore()
  if (enterpriseStore.status !== 'ready') {
    await enterpriseStore.resolveEnterprise()
  }
  const enterprise = enterpriseStore.enterprise
  if (enterprise == null || enterprise.tenant_id === '') {
    return false
  }

  writeEnterpriseTenantCache(enterprise)
  setEnterpriseAuthTenantId(enterprise.tenant_id)

  const maxAttempts = 4
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      tokenResult = await user.getIdTokenResult(true)
    }

    const tokenEnterpriseId = parseTokenEnterpriseId(tokenResult.claims)
    const ok = isEnterpriseAuthTenantConsistent(
      enterprise.tenant_id,
      enterprise.enterprise_id,
      tokenEnterpriseId,
      user.tenantId,
    )
    if (ok) {
      return true
    }

    if (attempt < maxAttempts - 1) {
      setEnterpriseAuthTenantId(enterprise.tenant_id)
      await sleep(100 * (attempt + 1))
    }
  }

  return false
}
