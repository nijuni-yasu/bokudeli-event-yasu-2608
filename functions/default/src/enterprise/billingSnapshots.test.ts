import { describe, expect, it, vi, beforeEach } from 'vitest'
import { DateTime } from 'luxon'

vi.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: (_opts: unknown, handler: unknown) => handler,
}))

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

vi.mock('../stores/config.js', () => ({
  getConfigGlobal: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: vi.fn(),
}))

vi.mock('../stores/enterpriseBillingSnapshot.js', () => ({
  listAllEnterpriseIds: vi.fn(),
  upsertBillingSnapshot: vi.fn(),
}))

vi.mock('../stores/enterpriseInvoiceFile.js', () => ({
  deleteInvoiceFileMeta: vi.fn(),
}))

vi.mock('./dashboardData.js', () => ({
  fetchDashboardData: vi.fn(),
}))

import { Enterprise, EnterpriseBillingSnapshot } from '@shokujii/common/schemas/Enterprise.js'
import { dashboardEventKey } from '@shokujii/common/utils/dashboardAggregation.js'
import { getEnterpriseById } from '../stores/enterprise.js'
import { getConfigGlobal } from '../stores/config.js'
import { upsertBillingSnapshot } from '../stores/enterpriseBillingSnapshot.js'
import { deleteInvoiceFileMeta } from '../stores/enterpriseInvoiceFile.js'
import { fetchDashboardData } from './dashboardData.js'
import {
  captureBillingSnapshotForEnterprise,
  getPreviousCalendarYearMonth,
  recaptureEnterpriseBillingSnapshot,
} from './billingSnapshots.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number): number {
  return DateTime.fromObject({ year, month, day, hour: 12 }, { zone: ZONE }).toMillis()
}

describe('getPreviousCalendarYearMonth', () => {
  it('7/1 JST 実行時は 2026-06', () => {
    const now = DateTime.fromObject({ year: 2026, month: 7, day: 1, hour: 0, minute: 10 }, { zone: ZONE }).toMillis()
    expect(getPreviousCalendarYearMonth(now, ZONE)).toBe('2026-06')
  })
})

describe('captureBillingSnapshotForEnterprise', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(fetchDashboardData).mockReset()
    vi.mocked(upsertBillingSnapshot).mockReset()
    vi.mocked(deleteInvoiceFileMeta).mockReset()
  })

  it('enterprise と meal 集計からスナップショットを upsert', async () => {
    const enterprise = new Enterprise('ent1', {
      company_name: 'Test',
      is_active: true,
      billing_settings: { unit_price: 500, billing_trial_ends_at: jst(2026, 1, 1) },
    })
    vi.mocked(getEnterpriseById).mockResolvedValue(enterprise)
    vi.mocked(fetchDashboardData).mockResolvedValue({
      orders: [
        {
          user_id: 'u1',
          community_id: 'c1',
          event_id: 'e1',
          menu_price: 1000,
          pay_enterprise_subsidy_amount: 400,
        },
      ],
      stripes: [],
      auditSessions: [],
      eventMonthMap: new Map([[dashboardEventKey('c1', 'e1'), '2026-06']]),
      members: [
        {
          user_id: 'u1',
          display_name: 'Alice',
          email: 'a@example.com',
          department: '',
          is_active: true,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: null,
        },
      ],
      billingSettings: {
        unit_price: 500,
        billing_trial_ends_at: jst(2026, 1, 1),
        enterprise_is_active: true,
      },
    })

    await captureBillingSnapshotForEnterprise('ent1', '2026-06')

    expect(upsertBillingSnapshot).toHaveBeenCalledTimes(1)
    const snapshot = vi.mocked(upsertBillingSnapshot).mock.calls[0]?.[1] as EnterpriseBillingSnapshot
    expect(snapshot.year_month).toBe('2026-06')
    expect(snapshot.meal_billing_amount).toBe(400)
    expect(snapshot.platform_fee_amount).toBe(500)
    expect(snapshot.billing_status).toBe('final')
    expect(deleteInvoiceFileMeta).toHaveBeenCalledWith('ent1', '2026-06')
  })
})

type RecaptureHandler = (req: {
  auth: { uid: string; token: Record<string, unknown> } | null
  data: { enterprise_id: string; year_month: string }
}) => Promise<{ success: true }>

const recaptureHandler = recaptureEnterpriseBillingSnapshot as unknown as RecaptureHandler

describe('recaptureEnterpriseBillingSnapshot', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(fetchDashboardData).mockReset()
    vi.mocked(upsertBillingSnapshot).mockReset()
    vi.mocked(deleteInvoiceFileMeta).mockReset()
  })

  it('当月は invalid-argument', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(DateTime.fromObject({ year: 2026, month: 6, day: 15 }, { zone: ZONE }).toMillis())
    await expect(
      recaptureHandler({
        auth: { uid: 'support', token: { user_type: 'enterprise', enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', year_month: '2026-06' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
    vi.useRealTimers()
  })

  it('未来月は invalid-argument', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(DateTime.fromObject({ year: 2026, month: 6, day: 15 }, { zone: ZONE }).toMillis())
    await expect(
      recaptureHandler({
        auth: { uid: 'support', token: { user_type: 'enterprise', enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', year_month: '2026-07' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
    vi.useRealTimers()
  })

  it('不正形式は invalid-argument', async () => {
    await expect(
      recaptureHandler({
        auth: { uid: 'support', token: { user_type: 'enterprise', enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', year_month: '202606' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('enterprise 不在は not-found', async () => {
    vi.mocked(getConfigGlobal).mockResolvedValue({
      isSupport: (uid: string) => uid === 'support',
    } as Awaited<ReturnType<typeof getConfigGlobal>>)
    vi.mocked(getEnterpriseById).mockResolvedValue(null)
    vi.useFakeTimers()
    vi.setSystemTime(DateTime.fromObject({ year: 2026, month: 7, day: 15 }, { zone: ZONE }).toMillis())
    await expect(
      recaptureHandler({
        auth: { uid: 'support', token: { user_type: 'enterprise', enterprise_id: 'ent-missing' } },
        data: { enterprise_id: 'ent-missing', year_month: '2026-05' },
      }),
    ).rejects.toMatchObject({ code: 'not-found' })
    expect(fetchDashboardData).not.toHaveBeenCalled()
    expect(upsertBillingSnapshot).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
