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
  buildEventMonthMap,
  DashboardPeriodError,
  validateDashboardPeriod,
  type DashboardAuditSession,
  type DashboardMemberMeta,
  type DashboardOrderLine,
  type DashboardStripeSession,
} from '@shokujii/common/utils/dashboardAggregation.js'
import { getEnterpriseById, listEnterpriseMembers } from '../stores/enterprise.js'
import { getEventsInCommunities } from '../stores/event.js'
import {
  listOrderCreateAuditLogs,
  listOrderedMemberOrdersByEnterprise,
  listStripesByEnterprise,
} from '../stores/dashboard.js'
import { getUserPersonalInformation } from '../stores/user.js'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'

type DashboardFetchResult = {
  orders: DashboardOrderLine[]
  stripes: DashboardStripeSession[]
  auditSessions: DashboardAuditSession[]
  eventMonthMap: Map<string, string>
  members: DashboardMemberMeta[]
  billingSettings: { unit_price: number; billing_trial_ends_at: number }
}

async function fetchDashboardData(enterpriseId: string): Promise<DashboardFetchResult> {
  const [enterprise, rawOrders, rawStripes, rawAuditLogs, rawMembers] = await Promise.all([
    getEnterpriseById(enterpriseId),
    listOrderedMemberOrdersByEnterprise(enterpriseId),
    listStripesByEnterprise(enterpriseId),
    listOrderCreateAuditLogs(enterpriseId),
    listEnterpriseMembers(enterpriseId),
  ])

  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  const orderById = new Map(rawOrders.map((order) => [order.order_id, order]))
  const eventRefs = new Map<string, { community_id: string; event_id: string }>()
  const addEventRef = (communityId: string, eventId: string) => {
    eventRefs.set(`${communityId}\t${eventId}`, { community_id: communityId, event_id: eventId })
  }

  for (const order of rawOrders) {
    addEventRef(order.community_id, order.event_id)
  }
  for (const stripe of rawStripes) {
    addEventRef(stripe.community_id, stripe.event_id)
  }

  const auditSessions: DashboardAuditSession[] = []
  for (const log of rawAuditLogs) {
    const orderIds = (log.details?.order_ids as string[] | undefined) ?? []
    const firstOrderId = orderIds[0]
    if (firstOrderId == null) continue
    const order = orderById.get(firstOrderId)
    if (order == null) continue
    addEventRef(order.community_id, order.event_id)
    auditSessions.push({ user_id: log.user_id, event_id: order.event_id })
  }

  const events = await getEventsInCommunities(Array.from(eventRefs.values()))
  const eventMonthMap = buildEventMonthMap(
    Array.from(events.values()).map((event) => ({
      event_id: event.id,
      event_start_datetime: event.event_start_datetime,
    })),
  )

  const memberEmails = await Promise.all(
    rawMembers.map(async (member) => {
      const personal = await getUserPersonalInformation(member.user_id)
      return [member.user_id, personal?.user_email ?? ''] as const
    }),
  )
  const emailByUserId = new Map(memberEmails)

  const members: DashboardMemberMeta[] = rawMembers.map((member) => ({
    user_id: member.user_id,
    display_name: member.display_name ?? '',
    email: emailByUserId.get(member.user_id) ?? '',
    department: member.department ?? '',
    is_active: member.is_active,
    last_activated_at: member.last_activated_at ?? null,
    last_deactivated_at: member.last_deactivated_at ?? null,
  }))

  return {
    orders: rawOrders.map((order) => ({
      user_id: order.user_id,
      event_id: order.event_id,
      menu_price: order.menu_price,
      pay_enterprise_subsidy_amount: order.pay_enterprise_subsidy_amount,
    })),
    stripes: rawStripes.map((stripe) => ({
      user_id: stripe.user_id,
      event_id: stripe.event_id,
    })),
    auditSessions,
    eventMonthMap,
    members,
    billingSettings: {
      unit_price: enterprise.billing_settings.unit_price,
      billing_trial_ends_at: enterprise.billing_settings.billing_trial_ends_at,
    },
  }
}

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
      const data = await fetchDashboardData(enterpriseId)
      const rows = aggregateMonthlyRows({
        startYearMonth,
        endYearMonth,
        orders: data.orders,
        stripes: data.stripes,
        auditSessions: data.auditSessions,
        eventMonthMap: data.eventMonthMap,
        members: data.members,
        billingSettings: data.billingSettings,
        allProvisional: true,
      })
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
