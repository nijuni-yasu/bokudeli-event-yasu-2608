import { getAuth } from 'firebase/auth'

export function setEnterpriseAuthTenantId(tenantId: string): void {
  getAuth().tenantId = tenantId
}

export function clearEnterpriseAuthTenantId(): void {
  getAuth().tenantId = null
}

export function isEnterpriseAuthTenantConsistent(
  resolvedTenantId: string | undefined,
  resolvedEnterpriseId: string | undefined,
  tokenEnterpriseId: string | undefined,
  userTenantId: string | null | undefined,
): boolean {
  if (resolvedTenantId == null || resolvedTenantId === '' || resolvedEnterpriseId == null) {
    return false
  }
  if (tokenEnterpriseId !== resolvedEnterpriseId) {
    return false
  }
  if (getAuth().tenantId !== resolvedTenantId) {
    return false
  }
  if (userTenantId != null && userTenantId !== resolvedTenantId) {
    return false
  }
  return true
}
