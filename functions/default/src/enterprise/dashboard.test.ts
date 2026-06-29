import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: <T>(handler: T) => handler,
}))

vi.mock('../stores/enterpriseBillingSnapshot.js', () => ({
  listBillingSnapshots: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: vi.fn(),
  listEnterpriseMembers: vi.fn(),
}))

vi.mock('../stores/event.js', () => ({
  getEventsInCommunities: vi.fn(),
}))

vi.mock('../stores/dashboard.js', () => ({
  listOrderedMemberOrdersByEnterprise: vi.fn(),
  listStripesByEnterprise: vi.fn(),
  listOrderCreateAuditLogs: vi.fn(),
}))

vi.mock('../utils/enterpriseAuthHelpers.js', () => ({
  assertEnterpriseAdmin: vi.fn(),
}))

import { HttpsError } from 'firebase-functions/https'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { DateTime } from 'luxon'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'
import { getEnterpriseById, listEnterpriseMembers } from '../stores/enterprise.js'
import { listBillingSnapshots } from '../stores/enterpriseBillingSnapshot.js'
import { getEventsInCommunities } from '../stores/event.js'
import {
  listOrderCreateAuditLogs,
  listOrderedMemberOrdersByEnterprise,
  listStripesByEnterprise,
} from '../stores/dashboard.js'
import { getDashboardMemberData, getDashboardMonthlyData } from './dashboard.js'
import type { ShokujiiEvent } from '../stores/event.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number): number {
  return DateTime.fromObject({ year, month, day, hour: 12 }, { zone: ZONE }).toMillis()
}

type MonthlyHandler = (req: {
  auth: { uid: string; token: { enterprise_id: string } }
  data: { enterprise_id: string; start_year_month: string; end_year_month: string }
}) => Promise<{ rows: unknown[] }>

const monthlyHandler = getDashboardMonthlyData as unknown as MonthlyHandler
const memberHandler = getDashboardMemberData as unknown as MonthlyHandler

describe('getDashboardMonthlyData', () => {
  beforeEach(() => {
    vi.mocked(assertEnterpriseAdmin).mockReset()
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(listEnterpriseMembers).mockReset()
    vi.mocked(listOrderedMemberOrdersByEnterprise).mockReset()
    vi.mocked(listStripesByEnterprise).mockReset()
    vi.mocked(listOrderCreateAuditLogs).mockReset()
    vi.mocked(getEventsInCommunities).mockReset()
    vi.mocked(listBillingSnapshots).mockReset()
    vi.mocked(listBillingSnapshots).mockResolvedValue([])
  })

  it('assertEnterpriseAdmin を通過しないと拒否', async () => {
    vi.mocked(assertEnterpriseAdmin).mockRejectedValue(new HttpsError('permission-denied', 'enterprise admin only'))
    await expect(
      monthlyHandler({
        auth: { uid: 'u1', token: { enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', start_year_month: '2026-06', end_year_month: '2026-06' },
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('期間超過は invalid-argument', async () => {
    vi.mocked(assertEnterpriseAdmin).mockResolvedValue(undefined)
    await expect(
      monthlyHandler({
        auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', start_year_month: '2024-01', end_year_month: '2026-01' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('月別集計を返す', async () => {
    vi.mocked(assertEnterpriseAdmin).mockResolvedValue(undefined)
    const enterprise = new Enterprise('ent1', {
      company_name: 'Test',
      billing_settings: { unit_price: 500, billing_trial_ends_at: jst(2026, 12, 31) },
    })
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    vi.mocked(listEnterpriseMembers).mockResolvedValue([
      new EnterpriseMember('u1', {
        user_id: 'u1',
        user_email: 'a@example.com',
        display_name: 'Alice',
        role: 'member',
        is_active: true,
        last_activated_at: jst(2026, 1, 1),
      }),
    ])
    vi.mocked(listOrderedMemberOrdersByEnterprise).mockResolvedValue([
      new EventMemberOrder('o1', {
        order_id: 'o1',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        status: 'ordered',
        menu_id: 'm1',
        menu_name: 'Lunch',
        menu_price: 1000,
        pay_enterprise_subsidy_amount: 400,
        enterprise_id: 'ent1',
      }),
    ])
    vi.mocked(listStripesByEnterprise).mockResolvedValue([])
    vi.mocked(listOrderCreateAuditLogs).mockResolvedValue([])
    const event = { id: 'e1', community_id: 'c1', event_start_datetime: jst(2026, 6, 15) } as ShokujiiEvent
    vi.mocked(getEventsInCommunities).mockResolvedValue(new Map([['c1\te1', event]]))

    const result = await monthlyHandler({
      auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
      data: { enterprise_id: 'ent1', start_year_month: '2026-06', end_year_month: '2026-06' },
    })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      year_month: '2026-06',
      total_amount: 1000,
      enterprise_subsidy_amount: 400,
      billing_status: 'provisional',
    })
  })
})

describe('getDashboardMemberData', () => {
  beforeEach(() => {
    vi.mocked(assertEnterpriseAdmin).mockReset()
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(listEnterpriseMembers).mockReset()
    vi.mocked(listOrderedMemberOrdersByEnterprise).mockReset()
    vi.mocked(listStripesByEnterprise).mockResolvedValue([])
    vi.mocked(listOrderCreateAuditLogs).mockResolvedValue([])
    vi.mocked(getEventsInCommunities).mockReset()
  })

  it('メンバー別集計を返す', async () => {
    vi.mocked(assertEnterpriseAdmin).mockResolvedValue(undefined)
    const enterprise = new Enterprise('ent1', {
      company_name: 'Test',
      billing_settings: { unit_price: 500, billing_trial_ends_at: jst(2026, 12, 31) },
    })
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    vi.mocked(listEnterpriseMembers).mockResolvedValue([
      new EnterpriseMember('u1', {
        user_id: 'u1',
        user_email: 'a@example.com',
        display_name: 'Alice',
        department: 'Sales',
        role: 'member',
        is_active: true,
        last_activated_at: jst(2026, 1, 1),
      }),
    ])
    vi.mocked(listOrderedMemberOrdersByEnterprise).mockResolvedValue([
      new EventMemberOrder('o1', {
        order_id: 'o1',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        status: 'ordered',
        menu_id: 'm1',
        menu_name: 'Lunch',
        menu_price: 800,
        enterprise_id: 'ent1',
      }),
    ])
    const event = { id: 'e1', community_id: 'c1', event_start_datetime: jst(2026, 6, 15) } as ShokujiiEvent
    vi.mocked(getEventsInCommunities).mockResolvedValue(new Map([['c1\te1', event]]))

    const result = await memberHandler({
      auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
      data: { enterprise_id: 'ent1', start_year_month: '2026-06', end_year_month: '2026-06' },
    })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      user_id: 'u1',
      display_name: 'Alice',
      email: 'a@example.com',
      total_amount: 800,
    })
  })
})
