import { describe, expect, it } from 'vitest'
import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import type { ShokujiiEvent } from '../stores/event.js'
import { getOrganizerReplyTo, getShopReplyTo, resolveReplyToEmail } from './mail.js'

function createTestPartnerShop(overrides: Partial<PartnerShop> = {}): PartnerShop {
  return new PartnerShop('partner1', 'shop1', {
    shop_name: 'Test Shop',
    shop_description: 'description',
    shop_genre: '和食',
    shop_email: 'login@example.com',
    shop_phone: '03-0000-0000',
    shop_postcode: '1000001',
    shop_address_base: '東京都千代田区',
    shop_address_detail: '1-1',
    shop_address_latitude: 35.681236,
    shop_address_longitude: 139.767125,
    is_approved: true,
    is_open: true,
    ...overrides,
  })
}

describe('resolveReplyToEmail', () => {
  it('trim 済みアドレスを返す', () => {
    expect(resolveReplyToEmail('  org@example.com  ')).toBe('org@example.com')
  })

  it('空文字・undefined は undefined', () => {
    expect(resolveReplyToEmail('')).toBeUndefined()
    expect(resolveReplyToEmail('   ')).toBeUndefined()
    expect(resolveReplyToEmail(undefined)).toBeUndefined()
  })
})

describe('getOrganizerReplyTo', () => {
  it('主催者メールを返す', () => {
    const event = { organizer_email: 'org@example.com' } as ShokujiiEvent
    expect(getOrganizerReplyTo(event)).toBe('org@example.com')
  })

  it('メール形式でない organizer_email は undefined', () => {
    const event = { organizer_email: 'not-an-email' } as ShokujiiEvent
    expect(getOrganizerReplyTo(event)).toBeUndefined()
  })
})

describe('getShopReplyTo', () => {
  it('shop_email_sub1 を優先する', () => {
    const shop = createTestPartnerShop({ shop_email_sub1: 'contact@example.com' })
    expect(getShopReplyTo(shop)).toBe('contact@example.com')
  })

  it('shop_email_sub1 未設定時は shop_email', () => {
    const shop = createTestPartnerShop()
    expect(getShopReplyTo(shop)).toBe('login@example.com')
  })

  it('shop_email_sub1 が空白のみのとき shop_email にフォールバックする', () => {
    const shop = createTestPartnerShop({ shop_email_sub1: '   ' })
    expect(getShopReplyTo(shop)).toBe('login@example.com')
  })

  it('shop_email_sub1 がメール形式でないとき shop_email にフォールバックする', () => {
    const shop = createTestPartnerShop({ shop_email_sub1: 'not-an-email' })
    expect(getShopReplyTo(shop)).toBe('login@example.com')
  })
})
