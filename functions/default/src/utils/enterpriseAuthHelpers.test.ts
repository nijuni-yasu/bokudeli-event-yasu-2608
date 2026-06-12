import { describe, expect, it } from 'vitest'
import { HttpsError } from 'firebase-functions/https'
import {
  assertValidEnterpriseSubdomain,
  emailDomainMatches,
  normalizeEnterpriseEmail,
} from './enterpriseAuthHelpers.js'

describe('enterpriseAuthHelpers', () => {
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
})
