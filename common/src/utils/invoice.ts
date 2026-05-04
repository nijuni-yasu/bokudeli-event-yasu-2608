/**
 * 請求関連のユーティリティと定数
 */

import type { CommunityBillSettingsType } from '../schemas/Event.js'
import type { EventMemberOrder } from '../schemas/EventMemberOrder.js'

/** 請求書 PDF の明細モード（documents/01_マネタイズと決済/03_無料参加・割引参加_請求書.md §1） */
export type CommunityBillInvoiceMode = 'menu' | 'discount'

/**
 * `community_bill_settings` から請求書の明細モードを返す。
 * 未設定・null・`free` → menu。`discount` → discount。
 */
export function getCommunityBillInvoiceMode(
  settings: CommunityBillSettingsType | null | undefined,
): CommunityBillInvoiceMode {
  if (settings == null) return 'menu'
  return settings.type === 'discount' ? 'discount' : 'menu'
}

/**
 * 請求手数料の計算ルールの変更日時（内部用）
 *
 * 2025-11-01 00:00 JST 前後で請求手数料の有無を変える
 * - 2025-11-01 00:00:00 JST = 2025-10-31 15:00:00 UTC = 1761922800000 (Unix time in milliseconds)
 *
 * この日時以降のイベントについては、請求書に10%の手数料を追加します。
 */
const CUTOFF_UNIX_TIME_2025_11_01_JST = 1761922800000

/**
 * イベント開始日時が請求手数料適用のカットオフ日時以降かどうかを判定する
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 */
export function isEventAfterInvoiceFeeCutoff(eventStartDatetime: number): boolean {
  return eventStartDatetime >= CUTOFF_UNIX_TIME_2025_11_01_JST
}

/**
 * イベントの請求手数料率（2025-11-01以降適用）
 */
export const INVOICE_FEE_RATE = 0.1

/**
 * 注文リストから注文済みの基本金額を計算
 * @param orders 注文リスト
 * @returns 注文済みの商品合計金額
 */
export function calculateOrdersTotal(orders: EventMemberOrder[]): number {
  return orders.filter((order) => order.status === 'ordered').reduce((sum, order) => sum + order.menu_price, 0)
}

/**
 * イベントの請求手数料を計算
 * @param baseAmount 基本金額（商品合計）
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 * @returns 請求手数料の金額（カットオフ日時前の場合は0）
 */
export function calculateInvoiceFee(baseAmount: number, eventStartDatetime: number): number {
  let fee: number
  if (eventStartDatetime >= CUTOFF_UNIX_TIME_2025_11_01_JST) {
    // 手数料は小数点以下切り捨て
    fee = Math.floor(baseAmount * INVOICE_FEE_RATE)
  } else {
    // カットオフ日時前の場合は手数料0円
    fee = 0
  }
  return fee
}

/**
 * 請求書の税内訳
 */
export interface InvoiceTaxBreakdown {
  total: number
  subTotal: number
  tax: number
  tax8Inclusive: number
  tax8SubTotal: number
  tax8: number
  tax10Inclusive: number
  tax10SubTotal: number
  tax10: number
}

/**
 * 8% 税込合計のみから税抜・税額を求める（領収書用）。
 * `calculateInvoiceTaxBreakdown` の 8% 部分と同一: 税抜は `Math.floor(税込 / 1.08)`。
 */
export function computeInclusive8ExTaxAndTax(taxInclusive: number): { exTaxPrice: number; taxPrice: number } {
  const exTaxPrice = Math.floor(taxInclusive / 1.08)
  return { exTaxPrice, taxPrice: taxInclusive - exTaxPrice }
}

/**
 * 請求書の税内訳（8% / 10%）を計算する
 * @param tax08Inclusive 8%税込合計（注文合計）
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 */
export function calculateInvoiceTaxBreakdown(tax08Inclusive: number, eventStartDatetime: number): InvoiceTaxBreakdown {
  const fee = calculateInvoiceFee(tax08Inclusive, eventStartDatetime)
  const tax10Inclusive = fee
  const total = tax08Inclusive + tax10Inclusive
  const { exTaxPrice: tax8SubTotal, taxPrice: tax8 } = computeInclusive8ExTaxAndTax(tax08Inclusive)
  const tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
  const tax10 = tax10Inclusive - tax10SubTotal
  const tax = tax8 + tax10
  const subTotal = tax8SubTotal + tax10SubTotal
  return {
    total,
    subTotal,
    tax,
    tax8Inclusive: tax08Inclusive,
    tax8SubTotal,
    tax8,
    tax10Inclusive,
    tax10SubTotal,
    tax10,
  }
}

/**
 * 請求書明細行のメニュー別集計結果
 */
export interface InvoiceMenuItem {
  menu_id: string
  name: string
  price: number
  count: number
  totalPrice: number
}

/**
 * 注文リストからメニュー別に数量・金額を集計する
 * @param orders 注文リスト（status によるフィルタは呼び出し側で行う）
 */
export function aggregateOrderMenus(orders: EventMemberOrder[]): InvoiceMenuItem[] {
  const menuMap = new Map<string, InvoiceMenuItem>()
  for (const order of orders) {
    const existing = menuMap.get(order.menu_id)
    if (existing != null) {
      existing.count++
      existing.totalPrice += order.menu_price
    } else {
      menuMap.set(order.menu_id, {
        menu_id: order.menu_id,
        name: order.menu_name,
        price: order.menu_price,
        count: 1,
        totalPrice: order.menu_price,
      })
    }
  }
  return Array.from(menuMap.values())
}

/**
 * 請求書の合計金額（手数料込み）を計算する
 * @param orders 注文リスト
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 */
export function calculateInvoiceTotal(orders: EventMemberOrder[], eventStartDatetime: number): number {
  const baseTotal = calculateOrdersTotal(orders)
  const invoiceFee = calculateInvoiceFee(baseTotal, eventStartDatetime)
  return baseTotal + invoiceFee
}

/**
 * 確定注文の主催者負担合計（割引総額）を算出する。
 * pay_community_bill_off_amount が正の整数のもののみ合算。
 * @param orders 注文リスト
 */
export function sumOrderedCommunityBillOffAmount(orders: EventMemberOrder[]): number {
  return orders
    .filter((o) => o.status === 'ordered')
    .reduce((sum, o) => {
      const amount = o.pay_community_bill_off_amount
      return typeof amount === 'number' && amount > 0 ? sum + amount : sum
    }, 0)
}

/**
 * 割引請求書の明細行ごとの集計結果
 */
export interface CommunityBillOffGroupLine {
  menuName: string
  amountPerOrder: number
  orderCount: number
  lineSubtotal: number
}

/**
 * 割引請求書の明細用に、メニュー名 × pay_community_bill_off_amount の組ごとに注文件数をまとめる。
 * 単価（おごり額）の降順、メニュー名の昇順でソートして返す。
 * @param orders 注文リスト
 */
export function groupOrderedCommunityBillOffByAmount(orders: EventMemberOrder[]): CommunityBillOffGroupLine[] {
  const groupMap = new Map<string, { menuName: string; amountPerOrder: number; orderCount: number }>()
  for (const o of orders) {
    if (o.status !== 'ordered') continue
    const amount = o.pay_community_bill_off_amount
    if (typeof amount !== 'number' || amount <= 0) continue
    const menuName = o.menu_name
    const key = `${amount}\u0000${menuName}`
    const cur = groupMap.get(key) ?? { menuName, amountPerOrder: amount, orderCount: 0 }
    cur.orderCount += 1
    groupMap.set(key, cur)
  }
  return Array.from(groupMap.values())
    .map((v) => ({
      menuName: v.menuName,
      amountPerOrder: v.amountPerOrder,
      orderCount: v.orderCount,
      lineSubtotal: v.amountPerOrder * v.orderCount,
    }))
    .sort((a, b) => b.amountPerOrder - a.amountPerOrder || a.menuName.localeCompare(b.menuName, 'ja'))
}

/**
 * 割引補填のみの請求書の税内訳（8% なし・補填と手数料をそれぞれ 10% 税込として分解）。
 * `tax10Inclusive` は手数料の税込額のみ（手数料行表示に利用）。
 */
export function calculateDiscountSubsidyInvoiceTaxBreakdown(
  subsidyTotalInclusive: number,
  eventStartDatetime: number,
): InvoiceTaxBreakdown {
  const S = subsidyTotalInclusive
  const F = calculateInvoiceFee(S, eventStartDatetime)
  const subsidyEx = Math.floor(S / 1.1)
  const subsidyTax = S - subsidyEx
  const feeEx = Math.floor(F / 1.1)
  const feeTax = F - feeEx
  const tax10SubTotal = subsidyEx + feeEx
  const tax10 = subsidyTax + feeTax
  return {
    total: S + F,
    subTotal: tax10SubTotal,
    tax: tax10,
    tax8Inclusive: 0,
    tax8SubTotal: 0,
    tax8: 0,
    tax10Inclusive: F,
    tax10SubTotal,
    tax10,
  }
}

/**
 * 主催者請求書の税込合計（一覧・PDF で同一式）。
 * - menu: メニュー計 + 売上に対する手数料（従来）
 * - discount: 割引総額 + 割引総額に対する手数料
 */
export function calculateEventBillInvoiceTotal(
  orders: EventMemberOrder[],
  eventStartDatetime: number,
  communityBillSettings: CommunityBillSettingsType | null | undefined,
): number {
  if (getCommunityBillInvoiceMode(communityBillSettings) === 'discount') {
    const subsidyTotal = sumOrderedCommunityBillOffAmount(orders)
    return subsidyTotal + calculateInvoiceFee(subsidyTotal, eventStartDatetime)
  }
  return calculateInvoiceTotal(orders, eventStartDatetime)
}

/** 割引請求の手数料行ラベル。メニュー請求の手数料行と同じ表記とする */
export const DISCOUNT_SUBSIDY_INVOICE_FEE_LABEL = '請求書払い手数料'

/**
 * 割引請求の明細行数（実額グループ + 手数料行）。パディング前の行数。
 */
export function countDiscountInvoiceDetailRows(groupLineCount: number, isAfterFeeCutoff: boolean): number {
  return groupLineCount + (isAfterFeeCutoff ? 1 : 0)
}
