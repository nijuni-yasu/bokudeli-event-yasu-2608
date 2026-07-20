import {
  assertRecapturableYearMonth,
  BillingSnapshotPeriodError,
  buildBillingSnapshot,
} from '@shokujii/common/utils/billingSnapshot.js'
import { aggregateMonthlyRows } from '@shokujii/common/utils/dashboardAggregation.js'
import { DEFAULT_TIME_ZONE, formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/https'
import { DateTime } from 'luxon'
import { EnterpriseBillingSnapshot } from '@shokujii/common/schemas/Enterprise.js'
import { getConfigGlobal } from '../stores/config.js'
import { getEnterpriseById } from '../stores/enterprise.js'
import { listAllEnterpriseIds, upsertBillingSnapshot } from '../stores/enterpriseBillingSnapshot.js'
import { deleteInvoiceFileMeta } from '../stores/enterpriseInvoiceFile.js'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'
import { createModuleLogger } from '../utils/logger.js'
import { fetchDashboardData } from './dashboardData.js'

const logger = createModuleLogger('billingSnapshots')

export function getPreviousCalendarYearMonth(now = Date.now(), zone = DEFAULT_TIME_ZONE): string {
  const dt = DateTime.fromMillis(now, { zone }).minus({ months: 1 })
  return `${dt.year}-${String(dt.month).padStart(2, '0')}`
}

function handleRecapturePeriodError(error: unknown): never {
  if (error instanceof BillingSnapshotPeriodError) {
    throw new HttpsError('invalid-argument', error.message)
  }
  throw error
}

export async function captureBillingSnapshotForEnterprise(enterpriseId: string, yearMonth: string): Promise<void> {
  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    logger.warn('Enterprise not found for billing snapshot', { enterpriseId, yearMonth })
    return
  }

  const data = await fetchDashboardData(enterpriseId)
  const rows = aggregateMonthlyRows({
    startYearMonth: yearMonth,
    endYearMonth: yearMonth,
    orders: data.orders,
    stripes: data.stripes,
    auditSessions: data.auditSessions,
    eventMonthMap: data.eventMonthMap,
    members: data.members,
    billingSettings: data.billingSettings,
    currentCalendarYearMonth: formatYearMonth(Date.now()),
  })
  const liveRow = rows[0]
  if (liveRow == null) {
    return
  }

  const fields = buildBillingSnapshot({
    yearMonth,
    unitPrice: enterprise.billing_settings.unit_price,
    billingTrialEndsAt: enterprise.billing_settings.billing_trial_ends_at,
    enterpriseIsActive: enterprise.is_active,
    members: data.members,
    mealBillingAmount: liveRow.enterprise_billing_amount,
  })

  await upsertBillingSnapshot(enterpriseId, new EnterpriseBillingSnapshot(yearMonth, fields))
  await deleteInvoiceFileMeta(enterpriseId, yearMonth)
}

export const captureEnterpriseBillingSnapshots = onSchedule(
  {
    schedule: '5 0 1 * *',
    timeZone: DEFAULT_TIME_ZONE,
    timeoutSeconds: 540,
  },
  async () => {
    const yearMonth = getPreviousCalendarYearMonth()
    const enterpriseIds = await listAllEnterpriseIds()
    logger.info('Capturing billing snapshots', { yearMonth, count: enterpriseIds.length })

    const failedEnterpriseIds: string[] = []
    for (const enterpriseId of enterpriseIds) {
      try {
        await captureBillingSnapshotForEnterprise(enterpriseId, yearMonth)
      } catch (error) {
        logger.error('Failed to capture billing snapshot', { enterpriseId, yearMonth, error })
        failedEnterpriseIds.push(enterpriseId)
      }
    }

    // 失敗があれば throw して自動リトライに乗せる（upsert なので成功済み enterprise の再実行はべき等）
    if (failedEnterpriseIds.length > 0) {
      throw new Error(
        `billing snapshot capture failed for ${failedEnterpriseIds.length} enterprise(s): ${failedEnterpriseIds.join(', ')}`,
      )
    }
  },
)

type RecaptureRequest = {
  enterprise_id: string
  year_month: string
}

export const recaptureEnterpriseBillingSnapshot = onCall<RecaptureRequest, Promise<{ success: true }>>(
  async (request) => {
    const { enterprise_id: enterpriseId, year_month: yearMonth } = request.data
    if (enterpriseId == null || yearMonth == null) {
      throw new HttpsError('invalid-argument', 'enterprise_id and year_month are required')
    }

    try {
      assertRecapturableYearMonth(yearMonth, formatYearMonth(Date.now()))
    } catch (error) {
      handleRecapturePeriodError(error)
    }

    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', 'not logged in')
    }

    const config = await getConfigGlobal()
    const isSupport = config?.isSupport(uid) ?? false
    if (!isSupport) {
      await assertEnterpriseAdmin(request.auth, enterpriseId)
    }

    const enterprise = await getEnterpriseById(enterpriseId)
    if (enterprise == null) {
      throw new HttpsError('not-found', 'Enterprise not found')
    }

    await captureBillingSnapshotForEnterprise(enterpriseId, yearMonth)
    return { success: true }
  },
)
