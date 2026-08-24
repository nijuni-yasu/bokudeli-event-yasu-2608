export type EventParticipantsVisibilitySource = {
  enterprise_id?: string | null
  members_visible_min_count?: number
}

/** PF 新規イベントの参加者表示開始人数デフォルト（#2289） */
export const DEFAULT_PF_MEMBERS_VISIBLE_MIN_COUNT = 3

/**
 * イベント詳細の参加者セクション表示可否。
 * 参加者 0 人のときは PF / enterprise とも非表示。
 * PF: `members_visible_min_count` 未設定は 1 人以上で表示、設定時は閾値以上で表示。
 * enterprise: しきい値設定はなく、1 人以上で表示（#2289）。
 */
export function shouldShowPfEventParticipantsSection(
  event: EventParticipantsVisibilitySource,
  memberCount: number,
): boolean {
  if (memberCount <= 0) {
    return false
  }
  if (event.enterprise_id != null && event.enterprise_id !== '') {
    return true
  }
  const threshold = event.members_visible_min_count
  if (threshold == null) {
    return true
  }
  return memberCount >= threshold
}
