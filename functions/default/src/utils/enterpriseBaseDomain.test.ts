import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/params', () => ({
  defineString: () => ({
    value: () => 'enterprise.example.com',
  }),
}))

import {
  getAllowedEnterpriseHosts,
  getEnterpriseSubdomainHost,
  resolveEnterpriseAppHost,
  resolveEnterpriseCheckoutOrigin,
} from './enterpriseBaseDomain.js'

describe('enterpriseBaseDomain checkout origin', () => {
  const enterprise = {
    subdomain: 'acme',
    custom_domain: 'lunch.acme.co.jp',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEnterpriseSubdomainHost', () => {
    it('subdomain と base domain からホストを構築する', () => {
      expect(getEnterpriseSubdomainHost('acme')).toBe('acme.enterprise.example.com')
    })
  })

  describe('getAllowedEnterpriseHosts', () => {
    it('subdomain ホストと custom_domain の両方を返す', () => {
      expect(getAllowedEnterpriseHosts(enterprise)).toEqual(['acme.enterprise.example.com', 'lunch.acme.co.jp'])
    })
  })

  describe('resolveEnterpriseAppHost', () => {
    it('custom_domain を優先する', () => {
      expect(resolveEnterpriseAppHost(enterprise)).toBe('lunch.acme.co.jp')
    })

    it('custom_domain 未設定時は subdomain ホストを返す', () => {
      expect(resolveEnterpriseAppHost({ subdomain: 'acme', custom_domain: null })).toBe('acme.enterprise.example.com')
    })

    it('解決不能時は undefined', () => {
      expect(resolveEnterpriseAppHost({ subdomain: '', custom_domain: null })).toBeUndefined()
    })
  })

  describe('resolveEnterpriseCheckoutOrigin', () => {
    it('許可された origin をそのまま採用する', () => {
      expect(resolveEnterpriseCheckoutOrigin(enterprise, 'https://lunch.acme.co.jp')).toBe('https://lunch.acme.co.jp')
    })

    it('許可されていない origin は正規 subdomain ホストへフォールバックする', () => {
      expect(resolveEnterpriseCheckoutOrigin(enterprise, 'https://evil.example.com')).toBe(
        'https://acme.enterprise.example.com',
      )
    })

    it('origin 未指定時は正規 subdomain ホストへフォールバックする', () => {
      expect(resolveEnterpriseCheckoutOrigin(enterprise)).toBe('https://acme.enterprise.example.com')
    })

    it('不正な origin 文字列はフォールバックする', () => {
      expect(resolveEnterpriseCheckoutOrigin(enterprise, 'not-a-url')).toBe('https://acme.enterprise.example.com')
    })

    it('port 付き localhost origin を custom_domain と hostname で照合する', () => {
      expect(
        resolveEnterpriseCheckoutOrigin({ subdomain: 'acme', custom_domain: 'localhost' }, 'http://localhost:5173'),
      ).toBe('http://localhost:5173')
    })
  })
})
