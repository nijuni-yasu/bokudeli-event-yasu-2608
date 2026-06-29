import { describe, expect, it } from 'vitest'
import { buildAuditLogOperatorLabel, buildAuditLogTargetLabel, isAuditLogGuest } from './auditLogDisplay.js'

const emptyContext = {
  memberDisplayNames: new Map<string, string>([
    ['u1', '田中太郎'],
    ['u2', '佐藤花子'],
  ]),
  communityNames: new Map<string, string>([['c1', 'ランチ部']]),
  eventNames: new Map<string, string>([['e1', '6月定例ランチ']]),
  enterpriseName: '株式会社テスト',
}

describe('isAuditLogGuest', () => {
  it('details.is_guest が true のとき true', () => {
    expect(isAuditLogGuest({ is_guest: true })).toBe(true)
  })

  it('details が null / undefined のとき false', () => {
    expect(isAuditLogGuest(null)).toBe(false)
    expect(isAuditLogGuest(undefined)).toBe(false)
  })
})

describe('buildAuditLogOperatorLabel', () => {
  it('system のときシステムラベル', () => {
    expect(
      buildAuditLogOperatorLabel({
        userId: 'system',
        memberDisplayNames: emptyContext.memberDisplayNames,
        systemLabel: 'システム',
        guestSuffix: '（ゲスト）',
      }),
    ).toBe('システム')
  })

  it('メンバー display_name を使う', () => {
    expect(
      buildAuditLogOperatorLabel({
        userId: 'u1',
        memberDisplayNames: emptyContext.memberDisplayNames,
        systemLabel: 'システム',
        guestSuffix: '（ゲスト）',
      }),
    ).toBe('田中太郎')
  })

  it('ゲストのとき suffix を付与', () => {
    expect(
      buildAuditLogOperatorLabel({
        userId: 'u1',
        details: { is_guest: true },
        memberDisplayNames: emptyContext.memberDisplayNames,
        systemLabel: 'システム',
        guestSuffix: '（ゲスト）',
      }),
    ).toBe('田中太郎（ゲスト）')
  })
})

describe('buildAuditLogTargetLabel', () => {
  const labels = {
    settings: '全社設定',
    enterpriseSubsidySettings: '補助設定',
    orderSession: (count: number) => `注文セッション（${count}件）`,
    fallback: '—',
  }

  it('order_session は order_ids 件数', () => {
    expect(
      buildAuditLogTargetLabel({
        targetType: 'order_session',
        details: { order_ids: ['o1', 'o2'] },
        context: emptyContext,
        labels,
      }),
    ).toBe('注文セッション（2件）')
  })

  it('community は community_name', () => {
    expect(
      buildAuditLogTargetLabel({
        targetType: 'community',
        targetId: 'c1',
        context: emptyContext,
        labels,
      }),
    ).toBe('ランチ部')
  })

  it('enterprise は company_name', () => {
    expect(
      buildAuditLogTargetLabel({
        targetType: 'enterprise',
        targetId: 'ent1',
        context: emptyContext,
        labels,
      }),
    ).toBe('株式会社テスト')
  })
})
