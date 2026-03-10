/**
 * 請求関連のユーティリティと定数
 */

import type { EventOrder } from '../schemas/EventOrder.js'

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
export function calculateOrdersTotal(orders: EventOrder[]): number {
  return orders.filter((order) => order.status === 'ordered').reduce((sum, order) => sum + order.totalPrice, 0)
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
 * 請求書の税内訳（8% / 10%）を計算する
 * @param tax08Inclusive 8%税込合計（注文合計）
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 */
export function calculateInvoiceTaxBreakdown(tax08Inclusive: number, eventStartDatetime: number): InvoiceTaxBreakdown {
  const fee = calculateInvoiceFee(tax08Inclusive, eventStartDatetime)
  const tax10Inclusive = fee
  const total = tax08Inclusive + tax10Inclusive
  const tax8SubTotal = Math.floor(tax08Inclusive / 1.08)
  const tax8 = tax08Inclusive - tax8SubTotal
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
export function aggregateOrderMenus(orders: EventOrder[]): InvoiceMenuItem[] {
  const menuMap = new Map<string, InvoiceMenuItem>()
  for (const order of orders) {
    for (const menu of order.menus) {
      const menuTotal = menu.price * menu.count
      const existing = menuMap.get(menu.menu_id)
      if (existing != null) {
        existing.count += menu.count
        existing.totalPrice += menuTotal
      } else {
        menuMap.set(menu.menu_id, {
          menu_id: menu.menu_id,
          name: menu.name,
          price: menu.price,
          count: menu.count,
          totalPrice: menuTotal,
        })
      }
    }
  }
  return Array.from(menuMap.values())
}

/**
 * 請求書の合計金額（手数料込み）を計算する
 * @param orders 注文リスト
 * @param eventStartDatetime イベント開始日時（Unix time in milliseconds）
 */
export function calculateInvoiceTotal(orders: EventOrder[], eventStartDatetime: number): number {
  const baseTotal = calculateOrdersTotal(orders)
  const invoiceFee = calculateInvoiceFee(baseTotal, eventStartDatetime)
  return baseTotal + invoiceFee
}
