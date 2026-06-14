import { HttpsError } from 'firebase-functions/https'
import type { CallableRequest } from 'firebase-functions/https'
import type { Transaction } from 'firebase-admin/firestore'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { replayEnterpriseSubsidyAmountsForOrders } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import { getEnterpriseMember, getEnterpriseMemberInTransaction } from '../stores/enterprise.js'
import type { ShokujiiEvent } from '../stores/event.js'
import { writeAuditLog } from './auditLog.js'

export function assertEnterpriseEventPaymentAllowed(event: ShokujiiEvent): void {
  const enterpriseId = event.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    return
  }
  if (event.event_payment === 'community_bill' || event.event_payment === 'user_on_day') {
    throw new HttpsError('invalid-argument', 'エンタープライズ版ではこの支払い方式は選択できません')
  }
}

export function getEventEnterpriseId(event: ShokujiiEvent): string | undefined {
  const enterpriseId = event.enterprise_id
  return enterpriseId != null && enterpriseId !== '' ? enterpriseId : undefined
}

export async function loadEnterpriseMemberForSubsidy(
  enterpriseId: string,
  userId: string,
  transaction?: Transaction,
): Promise<EnterpriseMember | undefined> {
  if (transaction != null) {
    return getEnterpriseMemberInTransaction(enterpriseId, userId, transaction)
  }
  return getEnterpriseMember(enterpriseId, userId)
}

/** enterprise_id 付きイベントは自社アクティブメンバーのみ注文可能 */
export async function assertActiveEnterpriseMember(
  enterpriseId: string | undefined,
  auth: CallableRequest['auth'],
  transaction?: Transaction,
): Promise<void> {
  if (enterpriseId == null) return
  if (auth?.uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }
  const tokenEnterpriseId = auth.token.enterprise_id as string | undefined
  if (tokenEnterpriseId !== enterpriseId) {
    throw new HttpsError('permission-denied', 'この企業イベントに注文する権限がありません')
  }
  const member = await loadEnterpriseMemberForSubsidy(enterpriseId, auth.uid, transaction)
  if (member == null || !member.is_active) {
    throw new HttpsError('permission-denied', 'この企業イベントに注文する権限がありません')
  }
}

export async function assertEnterpriseSubsidyOrdersConsistent(params: {
  enterpriseId: string
  userId: string
  event: ShokujiiEvent
  orders: EventMemberOrder[]
  orderIds: string[]
  member: EnterpriseMember
}): Promise<ReturnType<typeof replayEnterpriseSubsidyAmountsForOrders>> {
  const { enterpriseId, userId, event, orders, orderIds, member } = params
  if (event.event_payment !== 'enterprise_subsidy') {
    throw new HttpsError('internal', 'assertEnterpriseSubsidyOrdersConsistent called for non enterprise_subsidy')
  }
  if (event.enterprise_subsidy_settings == null) {
    throw new HttpsError('failed-precondition', 'enterprise_subsidy_settings is required')
  }

  const eventMonth = formatYearMonth(event.event_start_datetime)
  const replay = replayEnterpriseSubsidyAmountsForOrders(
    event.event_payment,
    event.enterprise_subsidy_settings,
    orders,
    member.monthly_usage[eventMonth] ?? 0,
  )

  const consistent = orders.every((order, i) => order.pay_enterprise_subsidy_amount === replay.expectedAmounts[i])
  if (!consistent) {
    await writeAuditLog({
      enterpriseId,
      userId,
      action: 'enterprise_subsidy_recalculated',
      targetType: 'order_session',
      details: {
        event_id: event.id,
        order_ids: orderIds,
        expected: replay.expectedAmounts,
        stored: orders.map((o) => o.pay_enterprise_subsidy_amount ?? null),
      },
    })
    throw new HttpsError('failed-precondition', '割引金額が一致しません。再度カートを確認してください。')
  }

  const used = member.monthly_usage[eventMonth] ?? 0
  if (used + replay.subsidyTotal > event.enterprise_subsidy_settings.monthly_limit_per_user) {
    throw new HttpsError('failed-precondition', '月額上限を超過しました。')
  }

  return replay
}

export type EnterpriseSubsidyWebhookSnapshotValidation =
  | { ok: true; subsidyTotal: number }
  | { ok: false; message: string }

/**
 * Webhook 確定時は Checkout 作成時点で保存済みの補助額をスナップショットとして扱う。
 * 並行 Checkout 完了後の monthly_usage 増加を理由に replay 再検証で reject しない。
 */
export function validateEnterpriseSubsidyOrdersSnapshotForWebhook(params: {
  event: ShokujiiEvent
  orders: EventMemberOrder[]
}): EnterpriseSubsidyWebhookSnapshotValidation {
  const { event, orders } = params
  if (event.event_payment !== 'enterprise_subsidy') {
    return { ok: false, message: 'validateEnterpriseSubsidyOrdersSnapshotForWebhook called for non enterprise_subsidy' }
  }
  if (event.enterprise_subsidy_settings == null) {
    return { ok: false, message: 'enterprise_subsidy_settings is required' }
  }

  let subsidyTotal = 0
  for (const order of orders) {
    const subsidy = order.pay_enterprise_subsidy_amount ?? 0
    if (subsidy < 0 || subsidy > order.menu_price) {
      return { ok: false, message: `Invalid subsidy amount on order ${order.order_id}` }
    }
    subsidyTotal += subsidy
  }

  return { ok: true, subsidyTotal }
}
