/**
 * configs/global の popular_event_mail_threshold の解釈（Firestore 非依存）。
 * 仕様: 正の整数のみ有効。それ以外は送信しない＋呼び出し側でエラーログ。
 */

export type PopularEventMailThresholdParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: 'missing' | 'invalid' }

export function parsePopularEventMailThreshold(threshold: number | undefined): PopularEventMailThresholdParseResult {
  if (threshold === undefined) {
    return { ok: false, reason: 'missing' }
  }
  if (typeof threshold !== 'number' || !Number.isInteger(threshold) || threshold < 1) {
    return { ok: false, reason: 'invalid' }
  }
  return { ok: true, value: threshold }
}

/** 第 2 トランザクション内の送信可否判定（Firestore 非依存） */
export function isEligibleForPopularEventMailSend(input: {
  isPublic: boolean
  eventStatusValue: string
  sentPopularEventMailAt: number | undefined
  memberCount: number
  eventMaxPeople: number
  threshold: number
}): boolean {
  if (!input.isPublic) return false
  if (input.eventStatusValue !== 'accepting_order') return false
  if (input.sentPopularEventMailAt != null) return false
  if (input.memberCount < input.threshold) return false
  if (input.memberCount > input.eventMaxPeople) return false
  return true
}
