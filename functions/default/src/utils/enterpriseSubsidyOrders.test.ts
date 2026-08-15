import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HttpsError } from 'firebase-functions/https'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { EnterpriseMember, Enterprise } from '@shokujii/common/schemas/Enterprise.js'
import { replayEnterpriseSubsidyAmountsForOrders } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import { ShokujiiEvent } from '../stores/event.js'

vi.mock('./auditLog.js', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: vi.fn(),
  getEnterpriseMemberInTransaction: vi.fn(),
  getEnterpriseById: vi.fn(),
  getEnterpriseRef: vi.fn((enterpriseId: string) => ({ path: `enterprises/${enterpriseId}` })),
  adjustEnterpriseMemberMonthlyUsage: vi.fn(),
}))

vi.mock('../stores/memberOrder.js', () => ({
  createOrder: vi.fn(),
  saveOrder: vi.fn(),
  clearOrderPayEnterpriseSubsidyAmount: vi.fn(),
}))

import { getEnterpriseMember, getEnterpriseMemberInTransaction } from '../stores/enterprise.js'
import { createOrder, saveOrder, clearOrderPayEnterpriseSubsidyAmount } from '../stores/memberOrder.js'
import {
  addEnterpriseSubsidyMenusToCart,
  assertActiveEnterpriseMember,
  assertEnterpriseEventPaymentAllowed,
  applyEnterpriseSubsidyPayFieldToCartTracker,
  buildEnterpriseSubsidyUsageExceededDetails,
  computeOrderSelfPayUnitAmount,
  createEnterpriseSubsidyAddToCartTracker,
  getStripeCheckoutLineItemGroupKey,
  sumEnterpriseSubsidyAmounts,
  sumEnterpriseUserPaidAmounts,
  syncEnterpriseSubsidyOrdersBeforeConfirm,
  validateEnterpriseSubsidyOrdersSnapshotForWebhook,
} from './enterpriseSubsidyOrders.js'

const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }
const subsidyHistory = [{ effective_from_month: '2026-06', ...settings }]

const mockEnterprise = () =>
  new Enterprise('ent1', {
    tenant_id: 'tenant-ent1',
    company_name: 'Test Corp',
    subdomain: 'testcorp',
    allowed_email_domains: ['example.com'],
    subsidy_settings_history: subsidyHistory,
    billing_settings: {
      unit_price: 500,
      trial_months: 3,
      billing_trial_ends_at: Date.now(),
    },
  })

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
      new EnterpriseMember('u1', {
        user_id: 'u1',
        user_email: 'user@example.com',
        is_active: false,
        monthly_usage: {},
        monthly_order_count: {},
      }),
    )
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-a' } } as never),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('自社アクティブメンバーは通過し member を返す', async () => {
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      user_email: 'user@example.com',
      is_active: true,
      monthly_usage: {},
      monthly_order_count: {},
    })
    vi.mocked(getEnterpriseMember).mockResolvedValue(member)
    await expect(
      assertActiveEnterpriseMember('ent-a', { uid: 'u1', token: { enterprise_id: 'ent-a' } } as never),
    ).resolves.toBe(member)
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

  it('syncEnterpriseSubsidyOrdersBeforeConfirm は一致時に replay を返す', async () => {
    const orders = [makeOrder('o1', 800, 500)]
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
    })
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      user_email: 'user@example.com',
      monthly_usage: { '2026-06': 1000 },
      monthly_order_count: {},
    })
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockEnterprise(),
      }),
    } as never
    const replay = await syncEnterpriseSubsidyOrdersBeforeConfirm({
      enterpriseId: 'ent1',
      userId: 'u1',
      communityId: 'c1',
      eventId: 'e1',
      event,
      orders,
      orderIds: ['o1'],
      member,
      transaction,
    })
    expect(replay.subsidyTotal).toBe(500)
    expect(replay.recalculated).toBe(false)
    expect(saveOrder).not.toHaveBeenCalled()
  })

  it('syncEnterpriseSubsidyOrdersBeforeConfirm は不一致時に書き戻し recalculated=true', async () => {
    const orders = [makeOrder('o1', 800, 999)]
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
    })
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      user_email: 'user@example.com',
      monthly_usage: {},
      monthly_order_count: {},
    })
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockEnterprise(),
      }),
    } as never
    const replay = await syncEnterpriseSubsidyOrdersBeforeConfirm({
      enterpriseId: 'ent1',
      userId: 'u1',
      communityId: 'c1',
      eventId: 'e1',
      event,
      orders,
      orderIds: ['o1'],
      member,
      transaction,
    })
    expect(replay.recalculated).toBe(true)
    expect(orders[0].pay_enterprise_subsidy_amount).toBe(500)
    expect(saveOrder).toHaveBeenCalled()
  })

  it('syncEnterpriseSubsidyOrdersBeforeConfirm は expected undefined 時に補助額フィールドを削除する', async () => {
    const orders = [makeOrder('o1', 800, 500), makeOrder('o2', 800, 500)]
    const event = new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
    })
    const member = new EnterpriseMember('u1', {
      user_id: 'u1',
      user_email: 'user@example.com',
      monthly_usage: { '2026-06': 7400 },
      monthly_order_count: {},
    })
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockEnterprise(),
      }),
    } as never
    const replay = await syncEnterpriseSubsidyOrdersBeforeConfirm({
      enterpriseId: 'ent1',
      userId: 'u1',
      communityId: 'c1',
      eventId: 'e1',
      event,
      orders,
      orderIds: ['o1', 'o2'],
      member,
      transaction,
    })
    expect(replay.recalculated).toBe(true)
    expect(orders[0].pay_enterprise_subsidy_amount).toBe(100)
    expect(orders[1].pay_enterprise_subsidy_amount).toBeUndefined()
    expect(clearOrderPayEnterpriseSubsidyAmount).toHaveBeenCalledWith('c1', 'e1', 'u1', 'o2', transaction)
  })
})

describe('validateEnterpriseSubsidyOrdersSnapshotForWebhook', () => {
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
    })

  it('applyEnterpriseSubsidyPayFieldToCartTracker は残枠内で補助額を付与する', () => {
    const tracker = createEnterpriseSubsidyAddToCartTracker(1000)
    const payField = applyEnterpriseSubsidyPayFieldToCartTracker({
      event: makeEvent(),
      settings,
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
      settings,
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

describe('addEnterpriseSubsidyMenusToCart', () => {
  const transaction = {} as never

  const makeEnterpriseMember = (monthlyUsage: Record<string, number> = { '2026-06': 1000 }) =>
    new EnterpriseMember('u1', {
      user_id: 'u1',
      user_email: 'user@example.com',
      is_active: true,
      monthly_usage: monthlyUsage,
      monthly_order_count: {},
    })

  const makeEvent = (overrides: Partial<ConstructorParameters<typeof ShokujiiEvent>[1]> = {}) =>
    new ShokujiiEvent('e1', {
      ...baseEventFields,
      enterprise_id: 'ent1',
      event_payment: 'enterprise_subsidy',
      event_start_datetime: Date.UTC(2026, 5, 15),
      ...overrides,
    })

  const eventMenus = [new EventMenu('e1', 'm1', { menu_name: 'menu', menu_price: 800, menu_sort_number: 0 })]

  beforeEach(() => {
    vi.mocked(getEnterpriseMemberInTransaction).mockReset()
    vi.mocked(createOrder).mockReset()
    vi.mocked(createOrder).mockResolvedValue(
      new EventMemberOrder('new-order', {
        order_id: 'new-order',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        menu_id: 'm1',
        menu_name: 'menu',
        menu_price: 800,
      }),
    )
  })

  it('残枠内で createOrder を count 分呼び pay_enterprise_subsidy_amount を付与する', async () => {
    const result = await addEnterpriseSubsidyMenusToCart({
      communityId: 'c1',
      eventId: 'e1',
      userId: 'u1',
      enterpriseId: 'ent1',
      event: makeEvent(),
      settings,
      menus: [{ menu_id: 'm1', count: 2 }],
      eventMenus,
      transaction,
      enterpriseMember: makeEnterpriseMember(),
    })

    expect(getEnterpriseMemberInTransaction).not.toHaveBeenCalled()
    expect(createOrder).toHaveBeenCalledTimes(2)
    expect(createOrder).toHaveBeenCalledWith(
      'c1',
      'e1',
      'u1',
      expect.objectContaining({ pay_enterprise_subsidy_amount: 500, enterprise_id: 'ent1' }),
      transaction,
    )
    expect(result).toBeNull()
  })

  it('残枠不足時は usage exceeded details を返す', async () => {
    const result = await addEnterpriseSubsidyMenusToCart({
      communityId: 'c1',
      eventId: 'e1',
      userId: 'u1',
      enterpriseId: 'ent1',
      event: makeEvent(),
      settings,
      menus: [{ menu_id: 'm1', count: 1 }],
      eventMenus,
      transaction,
      enterpriseMember: makeEnterpriseMember({ '2026-06': 7500 }),
    })

    expect(result).toMatchObject({ enterpriseId: 'ent1', eventMonth: '2026-06', unfilledCount: 1 })
  })

  it('EnterpriseMember 不在は failed-precondition', async () => {
    vi.mocked(getEnterpriseMemberInTransaction).mockResolvedValue(undefined)

    await expect(
      addEnterpriseSubsidyMenusToCart({
        communityId: 'c1',
        eventId: 'e1',
        userId: 'u1',
        enterpriseId: 'ent1',
        event: makeEvent(),
        settings,
        menus: [{ menu_id: 'm1', count: 1 }],
        eventMenus,
        transaction,
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('存在しない menu_id は failed-precondition', async () => {
    await expect(
      addEnterpriseSubsidyMenusToCart({
        communityId: 'c1',
        eventId: 'e1',
        userId: 'u1',
        enterpriseId: 'ent1',
        event: makeEvent(),
        settings,
        menus: [{ menu_id: 'unknown', count: 1 }],
        eventMenus,
        transaction,
        enterpriseMember: makeEnterpriseMember(),
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition', message: expect.stringContaining('unknown') })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('複数品目で一部のみ残枠内: 先頭は補助付き・後続は pay_enterprise_subsidy_amount 省略', async () => {
    const result = await addEnterpriseSubsidyMenusToCart({
      communityId: 'c1',
      eventId: 'e1',
      userId: 'u1',
      enterpriseId: 'ent1',
      event: makeEvent(),
      settings,
      menus: [{ menu_id: 'm1', count: 2 }],
      eventMenus,
      transaction,
      enterpriseMember: makeEnterpriseMember({ '2026-06': 7000 }),
    })

    expect(createOrder).toHaveBeenCalledTimes(2)
    expect(createOrder.mock.calls[0][3]).toMatchObject({ pay_enterprise_subsidy_amount: 500 })
    expect(createOrder.mock.calls[1][3]).not.toHaveProperty('pay_enterprise_subsidy_amount')
    expect(result).toMatchObject({ unfilledCount: 1, grantedTotal: 500 })
  })

  it('補助額 0（fixed value=0）では pay_enterprise_subsidy_amount: 0 を付与', async () => {
    await addEnterpriseSubsidyMenusToCart({
      communityId: 'c1',
      eventId: 'e1',
      userId: 'u1',
      enterpriseId: 'ent1',
      event: makeEvent(),
      settings: { type: 'fixed', value: 0, monthly_limit_per_user: 7500 },
      menus: [{ menu_id: 'm1', count: 1 }],
      eventMenus,
      transaction,
      enterpriseMember: makeEnterpriseMember(),
    })

    expect(createOrder).toHaveBeenCalledWith(
      'c1',
      'e1',
      'u1',
      expect.objectContaining({ pay_enterprise_subsidy_amount: 0 }),
      transaction,
    )
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

  it('sumEnterpriseUserPaidAmounts は menu_price から補助を引いた合計', () => {
    expect(sumEnterpriseUserPaidAmounts([makeOrder('o1', 800, 500), makeOrder('o2', 800, 300)])).toBe(800)
  })
})
