/**
 * 請求関連のユーティリティと定数
 */

import type { EventOrder } from '../schemas/EventOrder.js'

/**
 * 請求手数料の計算ルールの変更日時
 *
 * 2025-11-01 00:00 JST 前後で請求手数料の有無を変える
 * - 2025-11-01 00:00:00 JST = 2025-10-31 15:00:00 UTC = 1761922800000 (Unix time in milliseconds)
 *
 * この日時以降のイベントについては、請求書に10%の手数料を追加します。
 */
export const CUTOFF_UNIX_TIME_2025_11_01_JST = 1761922800000

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
