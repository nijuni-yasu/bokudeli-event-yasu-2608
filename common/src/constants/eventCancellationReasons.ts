/**
 * イベントキャンセル時に主催者が選択する定型理由（「その他」除く）。
 * 保存値・メール・お店管理画面表示でそのまま利用する。
 *
 * MECE の考え方:
 * - 誤申請・日程設定ミス等は「情報・手続の誤り」に集約（店舗には訂正・取り消しの理由として一続きで伝わる）
 * - 「人数が足りない」は需要・催行判断のみ（予算都合などは主催者事情に分離）
 * - 予算・運営方針・体調・急用は店内訳に立ち入らないよう主催者事情で一括
 * - 会場・施設都合は第三者要因として独立
 * - 上記に当てはまらない内容のみ「その他」＋自由記述
 */
export const EVENT_CANCEL_PRESET_REASONS = [
  '開催日時など申請内容に誤りがあり、この予約を取り消します。',
  '催行に必要な参加人数を確保できず、開催を中止します。',
  '主催者の事情（予算・急用・体調不良等）により、開催を中止します。',
  '会場・施設の都合により、開催を中止します。',
] as const

export type EventCancelPresetReasonType = (typeof EVENT_CANCEL_PRESET_REASONS)[number]

const PRESET_SET: ReadonlySet<string> = new Set(EVENT_CANCEL_PRESET_REASONS)

export function isPresetEventCancelReason(reason: string): reason is EventCancelPresetReasonType {
  return PRESET_SET.has(reason)
}
