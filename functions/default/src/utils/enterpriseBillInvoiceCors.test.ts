import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Enterprise } from '@shokujii/common/schemas/Enterprise.js'

vi.mock('firebase-functions/params', () => ({
  defineString: () => ({
    value: () => 'sandbox2510.tabete.co',
  }),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: vi.fn(),
}))

import { getEnterpriseById } from '../stores/enterprise.js'
import {
  applyEnterpriseBillInvoiceCorsHeaders,
  handleEnterpriseBillInvoiceCors,
  parseStaticCorsOrigins,
  resolveEnterpriseBillInvoiceCorsOrigin,
} from './enterpriseBillInvoiceCors.js'

const enterprise = new Enterprise('company-a', {
  company_name: 'Company A',
  subdomain: 'company-a',
  custom_domain: 'lunch.company-a.example',
  is_active: true,
})

describe('parseStaticCorsOrigins', () => {
  beforeEach(() => {
    delete process.env.CORS
  })

  it('未設定時は空配列', () => {
    expect(parseStaticCorsOrigins()).toEqual([])
  })

  it('JSON 配列をパースする', () => {
    process.env.CORS = '["https://localhost:5173"]'
    expect(parseStaticCorsOrigins()).toEqual(['https://localhost:5173'])
  })
})

describe('resolveEnterpriseBillInvoiceCorsOrigin', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseById).mockReset()
    delete process.env.CORS
  })

  it('静的 CORS リストに一致すれば Firestore を読まない', async () => {
    process.env.CORS = '["https://localhost:5173"]'
    const origin = await resolveEnterpriseBillInvoiceCorsOrigin('https://localhost:5173', 'company-a')
    expect(origin).toBe('https://localhost:5173')
    expect(getEnterpriseById).not.toHaveBeenCalled()
  })

  it('テナント subdomain ホストを許可する', async () => {
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    const origin = await resolveEnterpriseBillInvoiceCorsOrigin('https://company-a.sandbox2510.tabete.co', 'company-a')
    expect(origin).toBe('https://company-a.sandbox2510.tabete.co')
  })

  it('custom_domain を許可する', async () => {
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    const origin = await resolveEnterpriseBillInvoiceCorsOrigin('https://lunch.company-a.example', 'company-a')
    expect(origin).toBe('https://lunch.company-a.example')
  })

  it('Origin 前後スペースを trim して許可判定する', async () => {
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    const origin = await resolveEnterpriseBillInvoiceCorsOrigin(
      '  https://company-a.sandbox2510.tabete.co  ',
      'company-a',
    )
    expect(origin).toBe('https://company-a.sandbox2510.tabete.co')
  })

  it('別 enterprise のホストは拒否する', async () => {
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    const origin = await resolveEnterpriseBillInvoiceCorsOrigin('https://evil-other.sandbox2510.tabete.co', 'company-a')
    expect(origin).toBeUndefined()
  })
})

describe('handleEnterpriseBillInvoiceCors', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
  })

  it('許可 Origin の OPTIONS は 204', async () => {
    const headers: Record<string, string> = {}
    const res = {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value
      }),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    const result = await handleEnterpriseBillInvoiceCors(
      {
        method: 'OPTIONS',
        headers: { origin: 'https://company-a.sandbox2510.tabete.co' },
      },
      res as never,
      'company-a',
    )

    expect(result).toBe('handled')
    expect(res.status).toHaveBeenCalledWith(204)
    expect(headers['Access-Control-Allow-Origin']).toBe('https://company-a.sandbox2510.tabete.co')
  })

  it('許可外 Origin の GET は 403', async () => {
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    const result = await handleEnterpriseBillInvoiceCors(
      {
        method: 'GET',
        headers: { origin: 'https://evil.example.com' },
      },
      res as never,
      'company-a',
    )

    expect(result).toBe('handled')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('Origin なし GET は continue', async () => {
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    const result = await handleEnterpriseBillInvoiceCors(
      {
        method: 'GET',
        headers: {},
      },
      res as never,
      'company-a',
    )

    expect(result).toBe('continue')
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('applyEnterpriseBillInvoiceCorsHeaders', () => {
  it('allowedOrigin 未指定時はヘッダーを付けない', () => {
    const res = { setHeader: vi.fn() }
    applyEnterpriseBillInvoiceCorsHeaders(res as never, undefined)
    expect(res.setHeader).not.toHaveBeenCalled()
  })
})
