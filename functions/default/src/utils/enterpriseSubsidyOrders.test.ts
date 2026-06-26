import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HttpsError } from 'firebase-functions/https'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { replayEnterpriseSubsidyAmountsForOrders } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import { ShokujiiEvent } from '../stores/event.js'

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: vi.fn(),
}))

import { getEnterpriseMember } from '../stores/enterprise.js'
import {
  assertActiveEnterpriseMember,
  assertEnterpriseEventPaymentAllowed,
  assertEnterpriseSubsidyOrdersConsistent,
  applyEnterpriseSubsidyPayFieldToCartTracker,
  buildEnterpriseSubsidyUsageExceededDetails,
  computeOrderSelfPayUnitAmount,
  createEnterpriseSubsidyAddToCartTracker,
  getStripeCheckoutLineItemGroupKey,
  sumEnterpriseSubsidyAmounts,
  validateEnterpriseSubsidyOrdersSnapshotForWebhook,
} from './enterpriseSubsidyOrders.js'

const baseEventFields = {
  community_id: 'c1',
  community_name: 'test community',
  community_account: 'test-account',
}

describe('assertActiveEnterpriseMember', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseMember).mockReset()
  })

  it('enterpriseId なしはスルー', async () => {
    await expect(assertActiveEnterpriseMember(undefined, { uid: 'u1', token: {} } as never)).resolves.toBeUndefined()
    expect(getEnterpriseMember).not.toHaveBeenCalled()
  })

  it('token.enterprise_id 不一致は permission-denied', async () => {
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-b' } } as never),
    ).rejects.toMatchObject({ code: 'permission-denied' })
    expect(getEnterpriseMember).not.toHaveBeenCalled()
  })

  it('メンバー無しは permission-denied', async () => {
    vi.mocked(getEnterpriseMember).mockResolvedValue(undefined)
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-a' } } as never),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('is_active false は permission-denied', async () => {
    vi.mocked(getEnterpriseMember).mockResolvedValue(
      new EnterpriseMember('u1', { user_id: 'u1', is_active: false, monthly_usage: {}, monthly_order_count: {} }),
    )
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-a' } } as never),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('自社アクティブメンバーは通過', async () => {
    vi.mocked(getEnterpriseMember).mockResolvedValue(
      new EnterpriseMember('u1', { user_id: 'u1', is_active: true, monthly_usage: {}, monthly_order_count: {} }),
    )
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-a' } } as never),
    ).resolves.toBeUndefined()
  })
})

describe('assertEnterpriseEventPaymentAllowed', () => {
  it('enterprise_id なしは community_bill を許可', () => {
    const event = new ShokujiiEvent('e1', { ...baseEventFields, event_payment: 'community_bill' })
    expect(() => assertEnterpriseEventPaymentAllowed(event)).not.toThrow()
  })

  it('enterprise_id 付き community_bill は拒否', () => {
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'community_bill',
    })
    expect(() => assertEnterpriseEventPaymentAllowed(event)).toThrow(HttpsError)
  })

  it('enterprise_id 付き user_on_day は拒否', () => {
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'user_on_day',
    })
    expect(() => assertEnterpriseEventPaymentAllowed(event)).toThrow(HttpsError)
  })

  it('enterprise_id 付き enterprise_subsidy は許可', () => {
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
    })
    expect(() => assertEnterpriseEventPaymentAllowed(event)).not.toThrow()
  })
})

describe('enterprise subsidy order replay', () => {
  const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }

  const makeOrder = (id: string, menuPrice: number, subsidy?: number) =>
    new EventMemberOrder(id, {
      order_id: id,
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: menuPrice,
      ...(subsidy !== undefined ? { pay_enterprise_subsidy_amount: subsidy } : {}),
    })

  it('usage 加算分を反映した残枠で replay できる', () => {
    const orders = [makeOrder('o1', 800, 500)]
    const replay = replayEnterpriseSubsidyAmountsForOrders('enterprise_subsidy', settings, orders, 7000)
    expect(replay.expectedAmounts).toEqual([500])
    expect(replay.subsidyTotal).toBe(500)
    expect(replay.totalPayment).toBe(300)
  })

  it('残枠不足時は後続 order の補助額を省略する', () => {
    const orders = [makeOrder('o1', 800, 300), makeOrder('o2', 800, 500), makeOrder('o3', 800, undefined)]
    const replay = replayEnterpriseSubsidyAmountsForOrders('enterprise_subsidy', settings, orders, 7200)
    expect(replay.expectedAmounts).toEqual([300, undefined, undefined])
    expect(replay.subsidyTotal).toBe(300)
    expect(replay.totalPayment).toBe(2100)
  })

  it('assertEnterpriseSubsidyOrdersConsistent は一致時に replay を返す', async () => {
    const orders = [makeOrder('o1', 800, 500)]
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
      enterprise_subsidy_settings: settings,
    })
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      monthly_usage: { '2026-06': 1000 },
      monthly_order_count: {},
    })
    const replay = await assertEnterpriseSubsidyOrdersConsistent({
      enterpriseId: 'ent1',
      userId: 'u1',
      event,
      orders,
      orderIds: ['o1'],
      member,
    })
    expect(replay.subsidyTotal).toBe(500)
  })

  it('assertEnterpriseSubsidyOrdersConsistent は不一致時に failed-precondition', async () => {
    const orders = [makeOrder('o1', 800, 999)]
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
      enterprise_subsidy_settings: settings,
    })
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      monthly_usage: {},
      monthly_order_count: {},
    })
    await expect(
      assertEnterpriseSubsidyOrdersConsistent({
        enterpriseId: 'ent1',
        userId: 'u1',
        event,
        orders,
        orderIds: ['o1'],
        member,
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })
})

describe('validateEnterpriseSubsidyOrdersSnapshotForWebhook', () => {
  const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }

  const makeOrder = (id: string, menuPrice: number, subsidy?: number) =>
    new EventMemberOrder(id, {
      order_id: id,
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: menuPrice,
      ...(subsidy !== undefined ? { pay_enterprise_subsidy_amount: subsidy } : {}),
    })

  const makeEvent = () =>
    new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
      enterprise_subsidy_settings: settings,
    })

  it('保存済み補助額の合計を返す', () => {
    const result = validateEnterpriseSubsidyOrdersSnapshotForWebhook({
      event: makeEvent(),
      orders: [makeOrder('o1', 800, 500), makeOrder('o2', 800, 300)],
    })
    expect(result).toEqual({ ok: true, subsidyTotal: 800 })
  })

  it('menu_price を超える補助額は reject する', () => {
    const result = validateEnterpriseSubsidyOrdersSnapshotForWebhook({
      event: makeEvent(),
      orders: [makeOrder('o1', 800, 900)],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('o1')
    }
  })

  it('replay 再計算は行わないため monthly_usage 増加後でも保存済み補助額を受理する', () => {
    const result = validateEnterpriseSubsidyOrdersSnapshotForWebhook({
      event: makeEvent(),
      orders: [makeOrder('o1', 800, 500)],
    })
    expect(result).toEqual({ ok: true, subsidyTotal: 500 })
  })
})

describe('enterprise subsidy cart tracker', () => {
  const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }

  const makeEvent = () =>
    new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
      enterprise_subsidy_settings: settings,
    })

  it('applyEnterpriseSubsidyPayFieldToCartTracker は残枠内で補助額を付与する', () => {
    const tracker = createEnterpriseSubsidyAddToCartTracker(1000)
    const payField = applyEnterpriseSubsidyPayFieldToCartTracker({
      event: makeEvent(),
      menuPrice: 800,
      tracker,
    })
    expect(payField).toBe(500)
    expect(tracker.grantedTotal).toBe(500)
    expect(tracker.runningUsage).toBe(1500)
  })

  it('残枠不足時は unfilledCount を増やす', () => {
    const tracker = createEnterpriseSubsidyAddToCartTracker(7500)
    const payField = applyEnterpriseSubsidyPayFieldToCartTracker({
      event: makeEvent(),
      menuPrice: 800,
      tracker,
    })
    expect(payField).toBeUndefined()
    expect(tracker.unfilledCount).toBe(1)
    expect(
      buildEnterpriseSubsidyUsageExceededDetails({
        enterpriseId: 'ent1',
        eventMonth: '2026-06',
        tracker,
      }),
    ).toMatchObject({ unfilledCount: 1 })
  })
})

describe('stripe checkout helpers', () => {
  const makeOrder = (id: string, menuPrice: number, subsidy?: number) =>
    new EventMemberOrder(id, {
      order_id: id,
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: menuPrice,
      ...(subsidy !== undefined ? { pay_enterprise_subsidy_amount: subsidy } : {}),
    })

  it('computeOrderSelfPayUnitAmount は自己負担額を返す', () => {
    expect(computeOrderSelfPayUnitAmount(makeOrder('o1', 800, 500))).toBe(300)
  })

  it('getStripeCheckoutLineItemGroupKey は enterprise_subsidy で unitAmount ごとに分割', () => {
    const orderA = makeOrder('o1', 800, 500)
    const orderB = makeOrder('o2', 800, 300)
    expect(getStripeCheckoutLineItemGroupKey('enterprise_subsidy', orderA)).not.toBe(
      getStripeCheckoutLineItemGroupKey('enterprise_subsidy', orderB),
    )
    expect(getStripeCheckoutLineItemGroupKey('user_advance', orderA)).toBe('m1')
  })

  it('sumEnterpriseSubsidyAmounts は合計補助額', () => {
    expect(sumEnterpriseSubsidyAmounts([makeOrder('o1', 800, 500), makeOrder('o2', 800, 300)])).toBe(800)
  })
})
