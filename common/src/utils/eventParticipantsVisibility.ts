export type EventParticipantsVisibilitySource = {
  enterprise_id?: string | null
  members_visible_min_count?: number
}

/**
 * PF イベント詳細の参加者セクション表示可否。
 * enterprise イベントは常に true（本機能は enterprise 非対象）。
 */
export function shouldShowPfEventParticipantsSection(
  event: EventParticipantsVisibilitySource,
  memberCount: number,
): boolean {
  if (event.enterprise_id != null && event.enterprise_id !== '') {
    return true
  }
  const threshold = event.members_visible_min_count
  if (threshold == null) {
    return true
  }
  return memberCount >= threshold
}
