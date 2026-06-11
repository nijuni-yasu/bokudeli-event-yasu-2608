import { describe, expect, it } from 'vitest'
import {
  buildCommunityMemberCsv,
  buildCommunityMemberCsvRows,
  buildCsvContent,
  buildEventMemberCsv,
  buildEventMemberCsvHeaders,
  escapeCsvCell,
} from './memberCsvExport.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { User } from '@shokujii/common/schemas/User'

const sampleUser = (overrides: Partial<User> = {}): User =>
  ({
    user_id: 'u1',
    user_name: 'Alice "Test"',
    user_sns_twitter: 'alice',
    user_sns_facebook: '',
    user_sns_instagram: '',
    user_description: 'bio',
    ...overrides,
  }) as User

describe('escapeCsvCell', () => {
  it('ダブルクォートをエスケープする', () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"')
  })
})

describe('buildCommunityMemberCsvRows', () => {
  it('SNS URL とプロフィールを含む行を生成する', () => {
    const rows = buildCommunityMemberCsvRows([sampleUser()])
    expect(rows[0][0]).toBe('Alice "Test"')
    expect(rows[0][1]).toContain('alice')
    expect(rows[0][4]).toBe('bio')
  })
})

describe('buildCommunityMemberCsv', () => {
  it('ヘッダー行付き CSV を生成する', () => {
    const csv = buildCommunityMemberCsv([sampleUser()])
    expect(csv.startsWith('"UserName","X","Facebook","Instagram","UserProfile"\n')).toBe(true)
    expect(csv).toContain('Alice ""Test""')
  })
})

describe('buildEventMemberCsv', () => {
  it('community_bill 列を含められる', () => {
    const order = {
      order_id: 'o1',
      menu_name: 'ランチ',
      menu_price: 1000,
      pay_community_bill_off_amount: 200,
      status: 'ordered',
    } as EventMemberOrder
    const headers = buildEventMemberCsvHeaders({
      includeCommunityBill: true,
      statusLabel: '確定',
      nameLabel: '名前',
      orderLabel: '注文',
      menuPriceLabel: '単価',
      communityBillOffLabel: '割引',
      dateOrderedLabel: '日時',
    })
    expect(headers).toHaveLength(9)
    const csv = buildEventMemberCsv([{ order, member: sampleUser(), statusLabel: '確定', dateLabel: '2026-01-01' }], {
      includeCommunityBill: true,
      statusLabel: '確定',
      nameLabel: '名前',
      orderLabel: '注文',
      menuPriceLabel: '単価',
      communityBillOffLabel: '割引',
      dateOrderedLabel: '日時',
    })
    expect(csv).toContain('"200"')
    expect(csv).toContain('"ランチ"')
  })
})

describe('buildCsvContent', () => {
  it('空行なしで末尾改行を付ける', () => {
    expect(buildCsvContent(['A'], [['b']])).toBe('"A"\n"b"\n')
  })
})
