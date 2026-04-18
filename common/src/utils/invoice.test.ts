import { describe, expect, it } from 'vitest'
import { calculateInvoiceTaxBreakdown, computeInclusive8ExTaxAndTax } from './invoice.js'

describe('computeInclusive8ExTaxAndTax', () => {
  it('1100 円税込: 税抜は floor と税額の和が税込', () => {
    const { exTaxPrice, taxPrice } = computeInclusive8ExTaxAndTax(1100)
    expect(exTaxPrice).toBe(Math.floor(1100 / 1.08))
    expect(exTaxPrice + taxPrice).toBe(1100)
  })

  it('1000 円税込', () => {
    const { exTaxPrice, taxPrice } = computeInclusive8ExTaxAndTax(1000)
    expect(exTaxPrice).toBe(925)
    expect(taxPrice).toBe(75)
  })

  it('880 円税込', () => {
    const { exTaxPrice, taxPrice } = computeInclusive8ExTaxAndTax(880)
    expect(exTaxPrice).toBe(Math.floor(880 / 1.08))
    expect(exTaxPrice + taxPrice).toBe(880)
  })

  it('5400 円税込（税抜 5000・税 400）', () => {
    const { exTaxPrice, taxPrice } = computeInclusive8ExTaxAndTax(5400)
    expect(exTaxPrice).toBe(5000)
    expect(taxPrice).toBe(400)
  })

  it('0 円', () => {
    const { exTaxPrice, taxPrice } = computeInclusive8ExTaxAndTax(0)
    expect(exTaxPrice).toBe(0)
    expect(taxPrice).toBe(0)
  })

  it('請求書の 8% 内訳と一致する', () => {
    const tax08Inclusive = 5400
    const breakdown = calculateInvoiceTaxBreakdown(tax08Inclusive, 0)
    const receipt = computeInclusive8ExTaxAndTax(tax08Inclusive)
    expect(receipt.exTaxPrice).toBe(breakdown.tax8SubTotal)
    expect(receipt.taxPrice).toBe(breakdown.tax8)
  })
})
