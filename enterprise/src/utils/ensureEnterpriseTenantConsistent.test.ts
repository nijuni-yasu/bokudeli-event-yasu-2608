import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { User } from 'firebase/auth'
import { ensureEnterpriseTenantConsistent } from './ensureEnterpriseTenantConsistent'

const mockGetIdTokenResult = vi.fn()
const mockResolveEnterprise = vi.fn()
const mockEnterpriseRef = vi.hoisted(() => ({
  enterprise: {
    tenant_id: 'tenant-a',
    enterprise_id: 'ent-a',
  } as { tenant_id: string; enterprise_id: string } | null,
  status: 'ready' as 'ready' | 'loading',
}))

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ tenantId: 'tenant-a', currentUser: null }),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('@/stores/enterprise', () => ({
  useEnterpriseStore: () => ({
    get enterprise() {
      return mockEnterpriseRef.enterprise
    },
    get status() {
      return mockEnterpriseRef.status
    },
    resolveEnterprise: mockResolveEnterprise,
  }),
}))

vi.mock('@/utils/enterpriseAuth', () => ({
  setEnterpriseAuthTenantId: vi.fn(),
  isEnterpriseAuthTenantConsistent: vi.fn(
    (
      resolvedTenantId: string | undefined,
      resolvedEnterpriseId: string | undefined,
      tokenEnterpriseId: string | undefined,
      userTenantId: string | null | undefined,
    ) =>
      resolvedTenantId === 'tenant-a' &&
      resolvedEnterpriseId === 'ent-a' &&
      tokenEnterpriseId === 'ent-a' &&
      (userTenantId === 'tenant-a' || userTenantId == null),
  ),
}))

vi.mock('@/utils/enterpriseTenantCache', () => ({
  readCachedEnterpriseTenantEntry: vi.fn(() => null),
  writeEnterpriseTenantCache: vi.fn(),
}))

function makeUser(overrides?: Partial<User>): User {
  return {
    tenantId: 'tenant-a',
    getIdTokenResult: mockGetIdTokenResult,
    ...overrides,
  } as User
}

describe('ensureEnterpriseTenantConsistent', () => {
  beforeEach(() => {
    mockGetIdTokenResult.mockReset()
    mockResolveEnterprise.mockReset()
    mockEnterpriseRef.enterprise = { tenant_id: 'tenant-a', enterprise_id: 'ent-a' }
    mockEnterpriseRef.status = 'ready'
  })

  it('enterprise 従業員で整合すれば true', async () => {
    mockGetIdTokenResult.mockResolvedValue({
      claims: { user_type: 'enterprise', enterprise_id: 'ent-a' },
    })
    await expect(ensureEnterpriseTenantConsistent(makeUser())).resolves.toBe(true)
  })

  it('user_type が enterprise でなければ true（ガード対象外）', async () => {
    mockGetIdTokenResult.mockResolvedValue({
      claims: { user_type: 'user' },
    })
    await expect(ensureEnterpriseTenantConsistent(makeUser())).resolves.toBe(true)
    expect(mockResolveEnterprise).not.toHaveBeenCalled()
  })

  it('force refresh 後に整合すれば true', async () => {
    mockGetIdTokenResult
      .mockResolvedValueOnce({
        claims: { user_type: 'enterprise', enterprise_id: 'ent-wrong' },
      })
      .mockResolvedValueOnce({
        claims: { user_type: 'enterprise', enterprise_id: 'ent-a' },
      })
    await expect(ensureEnterpriseTenantConsistent(makeUser())).resolves.toBe(true)
    expect(mockGetIdTokenResult).toHaveBeenCalledWith(true)
  })

  it('最大リトライ後も不一致なら false', async () => {
    vi.useFakeTimers()
    mockGetIdTokenResult.mockResolvedValue({
      claims: { user_type: 'enterprise', enterprise_id: 'ent-wrong' },
    })
    const promise = ensureEnterpriseTenantConsistent(makeUser({ tenantId: 'tenant-wrong' }))
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe(false)
    expect(mockGetIdTokenResult).toHaveBeenCalledTimes(4)
    vi.useRealTimers()
  })
})
