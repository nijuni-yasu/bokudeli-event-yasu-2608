import { DateTime } from 'luxon'
import type { PartnerShop } from '../schemas/PartnerShop.js'
import { DEFAULT_TIME_ZONE } from './datetime.js'

/** 締切計算の書き込み先（イベントの開始・締切ミリ秒） */
export type EventDeadlineWritable = {
  event_start_datetime: number
  event_deadline_datetime: number
}

/**
 * 開催開始日時と店舗の締切ルールから `event_deadline_datetime` を更新する。
 * EventShop の店舗カード選択時と同じ計算式。
 */
export function updateEventDeadlineFromShop(
  event: EventDeadlineWritable,
  shop: Pick<PartnerShop, 'shop_deadline_datetime'>,
): void {
  let dt = DateTime.fromMillis(event.event_start_datetime, { zone: DEFAULT_TIME_ZONE })
  if (!dt.isValid) {
    return
  }
  const daysBefore = shop.shop_deadline_datetime.days_before
  if (daysBefore === 0) {
    dt = dt.minus({ milliseconds: shop.shop_deadline_datetime.time })
  } else {
    dt = dt.minus({ days: daysBefore })
    const deadlineTime = DateTime.fromMillis(shop.shop_deadline_datetime.time, { zone: DEFAULT_TIME_ZONE })
    if (!deadlineTime.isValid) {
      return
    }
    dt = dt.set({
      hour: deadlineTime.hour,
      minute: deadlineTime.minute,
    })
  }
  event.event_deadline_datetime = dt.toMillis()
}
