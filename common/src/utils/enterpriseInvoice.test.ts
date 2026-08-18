import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  buildEnterpriseInvoiceLineItems,
  buildEnterpriseInvoiceMergeData,
  buildEnterpriseInvoiceNumber,
  calculateEnterpriseInvoiceTaxBreakdown,
  getEnterpriseInvoicePaymentDeadlineMillis,
} from './enterpriseInvoice.js'

const snapshot = {
  year_month: '2026-06',
  active_account_count: 10,
  unit_price: 500,
  platform_fee_amount: 5000,
  is_trial: false,
  meal_billing_amount: 125000,
  total_billing_amount: 130000,
  snapshot_at: Date.UTC(2026, 6, 1),
  billing_status: 'final' as const,
}

describe('calculateEnterpriseInvoiceTaxBreakdown', () => {
  it('8% と 10% を分離して合計', () => {
    const breakdown = calculateEnterpriseInvoiceTaxBreakdown(5000, 125000)
    expect(breakdown.total).toBe(130000)
    expect(breakdown.tax8Inclusive).toBe(125000)
    expect(breakdown.tax10Inclusive).toBe(5000)
  })
})

describe('buildEnterpriseInvoiceLineItems', () => {
  it('2 行明細を生成', () => {
    const items = buildEnterpriseInvoiceLineItems(snapshot)
    expect(items[0]?.name).toContain('プラットフォーム利用料')
    expect(items[1]?.name).toContain('食事関連従量')
  })
})

describe('buildEnterpriseInvoiceNumber', () => {
  it('enterpriseId のハイフンを除去して先頭8文字と年月を連結', () => {
    expect(buildEnterpriseInvoiceNumber('company-ab', '2026-07')).toBe('companya-202607')
    expect(buildEnterpriseInvoiceNumber('enterprise123', '2026-06')).toBe('enterpri-202606')
  })
})

describe('buildEnterpriseInvoiceMergeData', () => {
  it('merge データに companyName と total を含む', () => {
    const data = buildEnterpriseInvoiceMergeData({
      enterpriseId: 'enterprise123',
      companyName: 'テスト株式会社',
      snapshot,
    })
    expect(data.companyName).toBe('テスト株式会社')
    expect(data.number).toBe('enterpri-202606')
    expect(data.total).toBe('130,000円')
    expect(data.billingNote).toContain('暦月')
  })
})

describe('getEnterpriseInvoicePaymentDeadlineMillis', () => {
  it('請求月の翌月末（JST）', () => {
    const deadline = getEnterpriseInvoicePaymentDeadlineMillis('2026-06', 'Asia/Tokyo')
    expect(DateTime.fromMillis(deadline, { zone: 'Asia/Tokyo' }).toFormat('yyyy-MM-dd')).toBe('2026-07-31')
  })
})
