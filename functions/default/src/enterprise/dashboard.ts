import { onCall, HttpsError } from 'firebase-functions/https'
import type {
  GetDashboardMemberDataRequest,
  GetDashboardMemberDataResponse,
  GetDashboardMonthlyDataRequest,
  GetDashboardMonthlyDataResponse,
} from '@shokujii/common/apis/dashboard.js'
import {
  aggregateMemberRows,
  aggregateMonthlyRows,
  DashboardPeriodError,
  mergeMonthlyRowsWithSnapshots,
  validateDashboardPeriod,
} from '@shokujii/common/utils/dashboardAggregation.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { listBillingSnapshots } from '../stores/enterpriseBillingSnapshot.js'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'
import { fetchDashboardData } from './dashboardData.js'

function handlePeriodError(error: unknown): never {
  if (error instanceof DashboardPeriodError) {
    throw new HttpsError('invalid-argument', error.message)
  }
  throw error
}

export const getDashboardMonthlyData = onCall<GetDashboardMonthlyDataRequest, Promise<GetDashboardMonthlyDataResponse>>(
  async (request) => {
    const { enterprise_id: enterpriseId, start_year_month: startYearMonth, end_year_month: endYearMonth } = request.data
    await assertEnterpriseAdmin(request.auth, enterpriseId)

    try {
      validateDashboardPeriod(startYearMonth, endYearMonth)
      const [data, snapshots] = await Promise.all([
        fetchDashboardData(enterpriseId),
        listBillingSnapshots(enterpriseId, startYearMonth, endYearMonth),
      ])
      const liveRows = aggregateMonthlyRows({
        startYearMonth,
        endYearMonth,
        orders: data.orders,
        stripes: data.stripes,
        auditSessions: data.auditSessions,
        eventMonthMap: data.eventMonthMap,
        members: data.members,
        billingSettings: data.billingSettings,
        currentCalendarYearMonth: formatYearMonth(Date.now()),
      })
      const rows = mergeMonthlyRowsWithSnapshots(
        liveRows,
        snapshots.map((snapshot) => ({
          year_month: snapshot.year_month,
          active_account_count: snapshot.active_account_count,
          platform_fee_amount: snapshot.platform_fee_amount,
          meal_billing_amount: snapshot.meal_billing_amount,
          total_billing_amount: snapshot.total_billing_amount,
          billing_status: snapshot.billing_status,
        })),
        formatYearMonth(Date.now()),
      )
      return { rows }
    } catch (error) {
      handlePeriodError(error)
    }
  },
)

export const getDashboardMemberData = onCall<GetDashboardMemberDataRequest, Promise<GetDashboardMemberDataResponse>>(
  async (request) => {
    const { enterprise_id: enterpriseId, start_year_month: startYearMonth, end_year_month: endYearMonth } = request.data
    await assertEnterpriseAdmin(request.auth, enterpriseId)

    try {
      validateDashboardPeriod(startYearMonth, endYearMonth)
      const data = await fetchDashboardData(enterpriseId)
      const rows = aggregateMemberRows({
        startYearMonth,
        endYearMonth,
        orders: data.orders,
        stripes: data.stripes,
        auditSessions: data.auditSessions,
        eventMonthMap: data.eventMonthMap,
        members: data.members,
      })
      return { rows }
    } catch (error) {
      handlePeriodError(error)
    }
  },
)
