import { describe, expect, it, vi } from 'vitest'
import { isEnterpriseAuthTenantConsistent } from './enterpriseAuth'

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ tenantId: 'tenant-a' }),
}))

describe('isEnterpriseAuthTenantConsistent', () => {
  it('resolved tenant / enterprise / token が一致すれば true', () => {
    expect(isEnterpriseAuthTenantConsistent('tenant-a', 'ent-a', 'ent-a', 'tenant-a')).toBe(true)
  })

  it('tenant 不一致は false', () => {
    expect(isEnterpriseAuthTenantConsistent('tenant-a', 'ent-a', 'ent-a', 'tenant-b')).toBe(false)
  })

  it('enterprise_id 不一致は false', () => {
    expect(isEnterpriseAuthTenantConsistent('tenant-a', 'ent-a', 'ent-b', 'tenant-a')).toBe(false)
  })
})
