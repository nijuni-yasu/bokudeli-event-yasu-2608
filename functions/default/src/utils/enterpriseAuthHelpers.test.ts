import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HttpsError } from 'firebase-functions/https'
import {
  assertEnterpriseAdmin,
  assertValidEnterpriseSubdomain,
  emailDomainMatches,
  normalizeEnterpriseEmail,
} from './enterpriseAuthHelpers.js'

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: vi.fn(),
  getEnterpriseById: vi.fn(),
}))

import { getEnterpriseById, getEnterpriseMember } from '../stores/enterprise.js'

const validAuthToken = {
  user_type: 'enterprise',
  enterprise_id: 'ent-a',
  enterprise_role: 'admin',
  firebase: { tenant: 'tenant-a' },
}

function mockEnterpriseTenant(tenantId = 'tenant-a') {
  vi.mocked(getEnterpriseById).mockResolvedValue({
    id: 'ent-a',
    tenant_id: tenantId,
  } as never)
}

describe('enterpriseAuthHelpers', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseMember).mockReset()
    vi.mocked(getEnterpriseById).mockReset()
  })
  describe('normalizeEnterpriseEmail', () => {
    it('trim と lowercase する', () => {
      expect(normalizeEnterpriseEmail('  Tanaka@Company-A.COM  ')).toBe('tanaka@company-a.com')
    })
  })

  describe('emailDomainMatches', () => {
    it('許可ドメインに一致する', () => {
      expect(emailDomainMatches('user@company-a.com', ['company-a.com', 'company-a.co.jp'])).toBe(true)
    })

    it('許可ドメインに一致しない', () => {
      expect(emailDomainMatches('user@other.com', ['company-a.com'])).toBe(false)
    })
  })

  describe('assertValidEnterpriseSubdomain', () => {
    it('有効な subdomain を受け付ける', () => {
      expect(() => assertValidEnterpriseSubdomain('company-a')).not.toThrow()
    })

    it('予約語を拒否する', () => {
      expect(() => assertValidEnterpriseSubdomain('www')).toThrow(HttpsError)
    })

    it('不正な形式を拒否する', () => {
      expect(() => assertValidEnterpriseSubdomain('-invalid')).toThrow(HttpsError)
    })
  })

  describe('assertEnterpriseAdmin', () => {
    it('members 正本で active admin を許可する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: true,
      } as never)
      mockEnterpriseTenant()

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: validAuthToken,
          } as never,
          'ent-a',
        ),
      ).resolves.toBeUndefined()
    })

    it('claims が admin でも members 正本が member なら拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'member',
        is_active: true,
      } as never)
      mockEnterpriseTenant()

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: validAuthToken,
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })

    it('無効化済み admin を拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: false,
      } as never)
      mockEnterpriseTenant()

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: validAuthToken,
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })

    it('firebase.tenant が無い場合は拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: true,
      } as never)
      mockEnterpriseTenant()

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: { ...validAuthToken, firebase: {} },
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })

    it('enterprise tenant_id と token tenant が不一致なら拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: true,
      } as never)
      mockEnterpriseTenant('tenant-b')

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: validAuthToken,
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })

    it('enterprise tenant_id が空なら拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: true,
      } as never)
      mockEnterpriseTenant('')

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: validAuthToken,
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })

    it('user_type が enterprise でない場合は拒否する', async () => {
      vi.mocked(getEnterpriseMember).mockResolvedValue({
        id: 'user-a',
        user_id: 'user-a',
        role: 'admin',
        is_active: true,
      } as never)
      mockEnterpriseTenant()

      await expect(
        assertEnterpriseAdmin(
          {
            uid: 'user-a',
            token: { ...validAuthToken, user_type: 'user' },
          } as never,
          'ent-a',
        ),
      ).rejects.toThrow(HttpsError)
    })
  })
})
