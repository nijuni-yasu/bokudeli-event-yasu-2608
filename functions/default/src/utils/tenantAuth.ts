import { getAuth, type TenantAwareAuth } from 'firebase-admin/auth'
import { getEnterpriseById } from '../stores/enterprise.js'

export class EnterpriseTenantNotConfiguredError extends Error {
  constructor(enterpriseId: string) {
    super(`Enterprise tenant_id is not configured: ${enterpriseId}`)
    this.name = 'EnterpriseTenantNotConfiguredError'
  }
}

export async function getTenantIdForEnterprise(enterpriseId: string): Promise<string> {
  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null || enterprise.tenant_id.trim() === '') {
    throw new EnterpriseTenantNotConfiguredError(enterpriseId)
  }
  return enterprise.tenant_id
}

export function authForEnterpriseTenant(tenantId: string): TenantAwareAuth {
  return getAuth().tenantManager().authForTenant(tenantId)
}

export async function authForEnterprise(enterpriseId: string): Promise<TenantAwareAuth> {
  const tenantId = await getTenantIdForEnterprise(enterpriseId)
  return authForEnterpriseTenant(tenantId)
}

/** Identity Platform tenant を作成し Firebase 発行 tenantId を返す（Q-1: 任意 ID 指定不可） */
export async function createIdentityPlatformTenant(displayName: string): Promise<string> {
  const tenant = await getAuth().tenantManager().createTenant({
    displayName,
  })
  return tenant.tenantId
}

export async function deleteIdentityPlatformTenant(tenantId: string): Promise<void> {
  await getAuth().tenantManager().deleteTenant(tenantId)
}
