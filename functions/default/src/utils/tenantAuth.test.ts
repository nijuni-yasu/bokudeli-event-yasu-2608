import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuthForTenant = vi.fn()
const mockCreateTenant = vi.fn()
const mockDeleteTenant = vi.fn()
const mockGetEnterpriseById = vi.fn()

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    tenantManager: () => ({
      authForTenant: mockAuthForTenant,
      createTenant: mockCreateTenant,
      deleteTenant: mockDeleteTenant,
    }),
  }),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: (...args: unknown[]) => mockGetEnterpriseById(...args),
}))

describe('tenantAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthForTenant.mockReturnValue({ kind: 'tenant-auth' })
  })

  it('getTenantIdForEnterprise は enterprise doc の tenant_id を返す', async () => {
    mockGetEnterpriseById.mockResolvedValue({ tenant_id: 'tenant-abc' })
    const { getTenantIdForEnterprise } = await import('./tenantAuth.js')
    await expect(getTenantIdForEnterprise('ent-1')).resolves.toBe('tenant-abc')
  })

  it('getTenantIdForEnterprise は tenant_id 未設定時にエラー', async () => {
    mockGetEnterpriseById.mockResolvedValue({ tenant_id: '' })
    const { getTenantIdForEnterprise, EnterpriseTenantNotConfiguredError } = await import('./tenantAuth.js')
    await expect(getTenantIdForEnterprise('ent-1')).rejects.toBeInstanceOf(EnterpriseTenantNotConfiguredError)
  })

  it('authForEnterpriseTenant は authForTenant を呼ぶ', async () => {
    const { authForEnterpriseTenant } = await import('./tenantAuth.js')
    const auth = authForEnterpriseTenant('tenant-xyz')
    expect(mockAuthForTenant).toHaveBeenCalledWith('tenant-xyz')
    expect(auth).toEqual({ kind: 'tenant-auth' })
  })

  it('createIdentityPlatformTenant は Firebase 発行 tenantId を返す', async () => {
    mockCreateTenant.mockResolvedValue({ tenantId: 'generated-tenant-id' })
    const { createIdentityPlatformTenant } = await import('./tenantAuth.js')
    await expect(createIdentityPlatformTenant('ent-display')).resolves.toBe('generated-tenant-id')
    expect(mockCreateTenant).toHaveBeenCalledWith({ displayName: 'ent-display' })
  })
})
