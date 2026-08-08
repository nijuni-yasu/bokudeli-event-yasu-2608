import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  readCachedEnterpriseTenantId,
  writeEnterpriseTenantCache,
  readCachedEnterpriseTenantEntry,
} from './enterpriseTenantCache'

vi.mock('@/utils/tenantHost', () => ({
  resolveTenantHost: () => 'company-a.example.test',
}))

describe('enterpriseTenantCache', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
  })

  it('write 後に tenant_id を read できる', () => {
    writeEnterpriseTenantCache({ tenant_id: 'tenant-1', enterprise_id: 'ent-1' })
    expect(readCachedEnterpriseTenantId()).toBe('tenant-1')
    const entry = readCachedEnterpriseTenantEntry()
    expect(entry?.enterprise_id).toBe('ent-1')
  })

  it('不正 JSON は null', () => {
    storage.set('shokujii:enterprise:tenant:v1:company-a.example.test', '{invalid')
    expect(readCachedEnterpriseTenantId()).toBeNull()
  })
})
