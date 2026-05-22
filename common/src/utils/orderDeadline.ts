import { DateTime } from 'luxon'

/**
 * 注文期限前（カート表示・注文可能）かどうか。
 * 期限ちょうどのミリ秒は有効（cart.vue の checkCart と同じ `<` 判定の否定）。
 */
export const isWithinOrderDeadline = (
  eventDeadlineMillis: number,
  nowMillis: number = DateTime.now().toMillis(),
): boolean => eventDeadlineMillis >= nowMillis
