import { HttpsError } from 'firebase-functions/https'
import type { CallableRequest } from 'firebase-functions/https'
import type { Transaction } from 'firebase-admin/firestore'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import type { EnterpriseSubsidySettingsType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import type { EventPaymentType } from '@shokujii/common/schemas/Event.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import {
  computePaymentEnterpriseSubsidyAmount,
  computeEnterpriseSubsidyTotalPayment,
  replayEnterpriseSubsidyAmountsForOrders,
  resolveEnterpriseSubsidySettingsForMonth,
} from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import {
  adjustEnterpriseMemberMonthlyUsage,
  getEnterpriseMember,
  getEnterpriseMemberInTransaction,
  getEnterpriseById,
  getEnterpriseRef,
} from '../stores/enterprise.js'
import type { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { clearOrderPayEnterpriseSubsidyAmount, createOrder, saveOrder } from '../stores/memberOrder.js'
import type { ShokujiiEvent } from '../stores/event.js'
import { writeAuditLog } from './auditLog.js'

export type EnterpriseSubsidyRecalculatedAudit = {
  enterpriseId: string
  userId: string
  details: {
    event_id: string
    order_ids: string[]
    expected: (number | undefined)[]
    stored: (number | null)[]
  }
}

export type SyncEnterpriseSubsidyOrdersBeforeConfirmResult = ReturnType<
  typeof replayEnterpriseSubsidyAmountsForOrders
> & {
  recalculated: boolean
  recalculatedAudit?: EnterpriseSubsidyRecalculatedAudit
}

export async function writeEnterpriseSubsidyRecalculatedAudit(
  audit: EnterpriseSubsidyRecalculatedAudit,
): Promise<void> {
  await writeAuditLog({
    enterpriseId: audit.enterpriseId,
    userId: audit.userId,
    action: 'enterprise_subsidy_recalculated',
    targetType: 'order_session',
    details: audit.details,
  })
}

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

export async function loadResolvedSubsidySettings(
  enterpriseId: string,
  eventMonth: string,
  transaction?: Transaction,
): Promise<EnterpriseSubsidySettingsType> {
  const snapshot = transaction != null ? await transaction.get(getEnterpriseRef(enterpriseId)) : undefined
  const enterprise = transaction != null ? snapshot?.data() : await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }
  try {
    return resolveEnterpriseSubsidySettingsForMonth(enterprise.subsidy_settings_history, eventMonth)
  } catch {
    throw new HttpsError('failed-precondition', `subsidy settings not found for event month ${eventMonth}`)
  }
}

/** enterprise_id 付きイベントは自社アクティブメンバーのみ注文可能 */
export async function assertActiveEnterpriseMember(
  enterpriseId: string | undefined,
  auth: CallableRequest['auth'],
  transaction?: Transaction,
): Promise<EnterpriseMember | undefined> {
  if (enterpriseId == null) return undefined
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
  return member
}

export async function syncEnterpriseSubsidyOrdersBeforeConfirm(params: {
  enterpriseId: string
  userId: string
  communityId: string
  eventId: string
  event: ShokujiiEvent
  orders: EventMemberOrder[]
  orderIds: string[]
  member: EnterpriseMember
  transaction: Transaction
}): Promise<SyncEnterpriseSubsidyOrdersBeforeConfirmResult> {
  const { enterpriseId, userId, communityId, eventId, event, orders, orderIds, member, transaction } = params
  if (event.event_payment !== 'enterprise_subsidy') {
    throw new HttpsError('internal', 'syncEnterpriseSubsidyOrdersBeforeConfirm called for non enterprise_subsidy')
  }

  const eventMonth = formatYearMonth(event.event_start_datetime)
  const settings = await loadResolvedSubsidySettings(enterpriseId, eventMonth, transaction)
  const replay = replayEnterpriseSubsidyAmountsForOrders(
    event.event_payment,
    settings,
    orders,
    member.monthly_usage[eventMonth] ?? 0,
  )

  const storedBeforeRecalc = orders.map((order) => order.pay_enterprise_subsidy_amount ?? null)

  let recalculated = false
  for (let i = 0; i < orders.length; i++) {
    const expected = replay.expectedAmounts[i]
    if (orders[i].pay_enterprise_subsidy_amount !== expected) {
      recalculated = true
      if (expected === undefined) {
        delete orders[i].pay_enterprise_subsidy_amount
        await clearOrderPayEnterpriseSubsidyAmount(communityId, eventId, userId, orders[i].id, transaction)
      } else {
        orders[i].pay_enterprise_subsidy_amount = expected
        saveOrder(communityId, eventId, userId, orders[i], transaction)
      }
    }
  }

  const recalculatedAudit: EnterpriseSubsidyRecalculatedAudit | undefined = recalculated
    ? {
        enterpriseId,
        userId,
        details: {
          event_id: event.id,
          order_ids: orderIds,
          expected: replay.expectedAmounts,
          stored: storedBeforeRecalc,
        },
      }
    : undefined

  const used = member.monthly_usage[eventMonth] ?? 0
  if (used + replay.subsidyTotal > settings.monthly_limit_per_user) {
    throw new HttpsError('failed-precondition', '月額上限を超過しました。')
  }

  return { ...replay, recalculated, recalculatedAudit }
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

export type EnterpriseSubsidyAddToCartTracker = {
  runningUsage: number
  requestedTotal: number
  grantedTotal: number
  unfilledCount: number
}

export type EnterpriseSubsidyUsageExceededDetails = {
  enterpriseId: string
  eventMonth: string
  requestedTotal: number
  grantedTotal: number
  unfilledCount: number
}

export function createEnterpriseSubsidyAddToCartTracker(monthlyUsage: number): EnterpriseSubsidyAddToCartTracker {
  return {
    runningUsage: monthlyUsage,
    requestedTotal: 0,
    grantedTotal: 0,
    unfilledCount: 0,
  }
}

/** カート追加時: 1 品目分の pay_enterprise_subsidy_amount を計算し tracker を更新 */
export function applyEnterpriseSubsidyPayFieldToCartTracker(params: {
  event: ShokujiiEvent
  settings: EnterpriseSubsidySettingsType
  menuPrice: number
  tracker: EnterpriseSubsidyAddToCartTracker
}): number | undefined {
  const { event, settings, menuPrice, tracker } = params
  const remaining = Math.max(0, settings.monthly_limit_per_user - tracker.runningUsage)
  const candidateBase =
    computePaymentEnterpriseSubsidyAmount(event.event_payment, settings, menuPrice, Number.MAX_SAFE_INTEGER) ?? 0
  tracker.requestedTotal += candidateBase
  const payField = computePaymentEnterpriseSubsidyAmount(event.event_payment, settings, menuPrice, remaining)
  if (payField != null && payField > 0) {
    tracker.runningUsage += payField
    tracker.grantedTotal += payField
  } else if (candidateBase > 0) {
    tracker.unfilledCount += 1
  }
  return payField
}

export function buildEnterpriseSubsidyUsageExceededDetails(params: {
  enterpriseId: string
  eventMonth: string
  tracker: EnterpriseSubsidyAddToCartTracker
}): EnterpriseSubsidyUsageExceededDetails | null {
  const { enterpriseId, eventMonth, tracker } = params
  if (tracker.unfilledCount <= 0) {
    return null
  }
  return {
    enterpriseId,
    eventMonth,
    requestedTotal: tracker.requestedTotal,
    grantedTotal: tracker.grantedTotal,
    unfilledCount: tracker.unfilledCount,
  }
}

export type AddToCartMenuInput = { menu_id: string; count: number }

/** addToCart: enterprise_subsidy のメニュー追加と usage exceeded 判定 */
export async function addEnterpriseSubsidyMenusToCart(params: {
  communityId: string
  eventId: string
  userId: string
  enterpriseId: string
  event: ShokujiiEvent
  settings: EnterpriseSubsidySettingsType
  menus: AddToCartMenuInput[]
  eventMenus: EventMenu[]
  transaction: Transaction
  /** assertActiveEnterpriseMember 等で取得済みの場合は渡し、Transaction 内 read を省略 */
  enterpriseMember?: EnterpriseMember
}): Promise<EnterpriseSubsidyUsageExceededDetails | null> {
  const {
    communityId,
    eventId,
    userId,
    enterpriseId,
    event,
    settings,
    menus,
    eventMenus,
    transaction,
    enterpriseMember,
  } = params

  const eventMonth = formatYearMonth(event.event_start_datetime)
  const entMember = enterpriseMember ?? (await loadEnterpriseMemberForSubsidy(enterpriseId, userId, transaction))
  if (entMember == null) {
    throw new HttpsError('failed-precondition', '企業メンバー情報が見つかりません')
  }

  const tracker = createEnterpriseSubsidyAddToCartTracker(entMember.monthly_usage[eventMonth] ?? 0)

  for (const menu of menus) {
    const masterMenu = eventMenus.find((m) => m.id === menu.menu_id)
    if (masterMenu == null) {
      throw new HttpsError('failed-precondition', `メニューが見つかりません: ${menu.menu_id}`)
    }

    for (let i = 0; i < menu.count; i++) {
      const payField = applyEnterpriseSubsidyPayFieldToCartTracker({
        event,
        settings,
        menuPrice: masterMenu.menu_price,
        tracker,
      })
      await createOrder(
        communityId,
        eventId,
        userId,
        {
          user_id: userId,
          event_id: eventId,
          community_id: communityId,
          status: 'in_cart',
          menu_id: masterMenu.id,
          menu_name: masterMenu.menu_name,
          menu_price: masterMenu.menu_price,
          enterprise_id: enterpriseId,
          ...(payField !== undefined ? { pay_enterprise_subsidy_amount: payField } : {}),
        },
        transaction,
      )
    }
  }

  return buildEnterpriseSubsidyUsageExceededDetails({
    enterpriseId,
    eventMonth,
    tracker,
  })
}

/** confirmOrder: 自己負担 0 円の enterprise_subsidy 注文を確定し usage を加算 */
export async function finalizeEnterpriseSubsidyZeroPaymentOrder(params: {
  enterpriseId: string
  userId: string
  communityId: string
  eventId: string
  event: ShokujiiEvent
  orders: EventMemberOrder[]
  orderIds: string[]
  member: EnterpriseMember
  transaction: Transaction
  orderedAt: number
}): Promise<{
  enterpriseId: string
  subsidyTotal: number
  recalculated: boolean
  recalculatedAudit?: EnterpriseSubsidyRecalculatedAudit
}> {
  const { enterpriseId, userId, communityId, eventId, event, orders, orderIds, member, transaction, orderedAt } = params
  const sync = await syncEnterpriseSubsidyOrdersBeforeConfirm({
    enterpriseId,
    userId,
    communityId,
    eventId,
    event,
    orders,
    orderIds,
    member,
    transaction,
  })
  if (sync.recalculated) {
    return {
      enterpriseId,
      subsidyTotal: sync.subsidyTotal,
      recalculated: true,
      recalculatedAudit: sync.recalculatedAudit,
    }
  }
  const totalPayment = computeEnterpriseSubsidyTotalPayment(orders)
  if (totalPayment !== 0) {
    throw new HttpsError(
      'failed-precondition',
      'confirmOrder は自己負担0円のときのみ使用できます。Stripe 決済が必要です。',
    )
  }
  const eventMonth = formatYearMonth(event.event_start_datetime)
  const userPaidTotal = sumEnterpriseUserPaidAmounts(orders)
  await adjustEnterpriseMemberMonthlyUsage(
    enterpriseId,
    userId,
    eventMonth,
    sync.subsidyTotal,
    orders.length,
    userPaidTotal,
    transaction,
  )
  for (const order of orders) {
    order.status = 'ordered'
    order.ordered_at = orderedAt
    saveOrder(communityId, eventId, userId, order, transaction)
  }
  return { enterpriseId, subsidyTotal: sync.subsidyTotal, recalculated: false }
}

export function computeOrderSelfPayUnitAmount(order: EventMemberOrder): number {
  return order.menu_price - (order.pay_enterprise_subsidy_amount ?? order.pay_community_bill_off_amount ?? 0)
}

export function getStripeCheckoutLineItemGroupKey(eventPayment: EventPaymentType, order: EventMemberOrder): string {
  if (eventPayment === 'enterprise_subsidy') {
    return `${order.menu_id}\u0000${computeOrderSelfPayUnitAmount(order)}`
  }
  return order.menu_id
}

export function sumEnterpriseSubsidyAmounts(orders: EventMemberOrder[]): number {
  return orders.reduce((sum, o) => sum + (o.pay_enterprise_subsidy_amount ?? 0), 0)
}

export function sumEnterpriseUserPaidAmounts(orders: EventMemberOrder[]): number {
  return orders.reduce((sum, order) => sum + computeOrderSelfPayUnitAmount(order), 0)
}

/** cancelOrders: enterprise_subsidy の usage を減算 */
export async function revertEnterpriseSubsidyUsageOnCancel(params: {
  enterpriseId: string
  userId: string
  eventMonth: string
  orders: EventMemberOrder[]
  transaction: Transaction
}): Promise<number> {
  const { enterpriseId, userId, eventMonth, orders, transaction } = params
  const subsidyTotal = sumEnterpriseSubsidyAmounts(orders)
  const userPaidTotal = sumEnterpriseUserPaidAmounts(orders)
  await adjustEnterpriseMemberMonthlyUsage(
    enterpriseId,
    userId,
    eventMonth,
    -subsidyTotal,
    -orders.length,
    -userPaidTotal,
    transaction,
  )
  return subsidyTotal
}

export type EnterpriseSubsidyWebhookProcessResult =
  | { ok: false; message: string }
  | {
      ok: true
      subsidyTotal: number
      enterpriseOrderCreateLog?: { enterpriseId: string; subsidyTotal: number }
    }

/** stripeWebhook: enterprise_subsidy のスナップショット検証と usage 加算 */
export async function processEnterpriseSubsidyOrdersForWebhook(params: {
  enterpriseId: string
  userId: string
  event: ShokujiiEvent
  orders: EventMemberOrder[]
  transaction: Transaction
}): Promise<EnterpriseSubsidyWebhookProcessResult> {
  const { enterpriseId, userId, event, orders, transaction } = params
  const entMember = await loadEnterpriseMemberForSubsidy(enterpriseId, userId, transaction)
  if (entMember == null) {
    return { ok: false, message: 'EnterpriseMember not found' }
  }
  const snapshotValidation = validateEnterpriseSubsidyOrdersSnapshotForWebhook({ event, orders })
  if (!snapshotValidation.ok) {
    return { ok: false, message: snapshotValidation.message }
  }
  const ordersToConfirm = orders.filter((o) => o.status !== 'ordered')
  const subsidyToAdd = sumEnterpriseSubsidyAmounts(ordersToConfirm)
  const subsidyTotal = sumEnterpriseSubsidyAmounts(orders)
  if (ordersToConfirm.length > 0) {
    const eventMonth = formatYearMonth(event.event_start_datetime)
    const userPaidToAdd = sumEnterpriseUserPaidAmounts(ordersToConfirm)
    await adjustEnterpriseMemberMonthlyUsage(
      enterpriseId,
      userId,
      eventMonth,
      subsidyToAdd,
      ordersToConfirm.length,
      userPaidToAdd,
      transaction,
    )
    return {
      ok: true,
      subsidyTotal,
      enterpriseOrderCreateLog: { enterpriseId, subsidyTotal: subsidyTotal },
    }
  }
  return { ok: true, subsidyTotal }
}
