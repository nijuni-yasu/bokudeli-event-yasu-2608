import { DateTime } from 'luxon'
import type { Event, RawEventStatusType } from '../schemas/Event.js'
import {
  MINIMUM_PARTICIPANTS_DEFAULT_COUNT,
  MINIMUM_PARTICIPANTS_DEFAULT_JUDGMENT_DAYS_BEFORE,
  type MinimumParticipantsType,
} from '../schemas/Event.js'

export { MINIMUM_PARTICIPANTS_DEFAULT_COUNT, MINIMUM_PARTICIPANTS_DEFAULT_JUDGMENT_DAYS_BEFORE }

/** 最小催行による自動中止時の `event_status.cancel_reason` */
export const MINIMUM_PARTICIPANTS_CANCEL_REASON = '最小催行人数に達しなかったため自動中止'

const JST = 'Asia/Tokyo'

/**
 * 注文期限と判断日数から judgment_datetime（epoch ms、分 truncate）を算出する。
 * pollingTask の 1 分ウィンドウと整合させる。
 */
export function computeMinimumParticipantsJudgmentDatetime(
  eventDeadlineDatetimeMillis: number,
  judgmentDaysBefore: number,
): number {
  const dt = DateTime.fromMillis(eventDeadlineDatetimeMillis, { zone: JST }).minus({ days: judgmentDaysBefore })
  return Math.trunc(dt.toMillis() / 60_000) * 60_000
}

export function createDefaultMinimumParticipants(eventDeadlineDatetimeMillis: number): MinimumParticipantsType {
  const judgment_days_before = MINIMUM_PARTICIPANTS_DEFAULT_JUDGMENT_DAYS_BEFORE
  return {
    enabled: true,
    count: MINIMUM_PARTICIPANTS_DEFAULT_COUNT,
    judgment_days_before,
    judgment_datetime: computeMinimumParticipantsJudgmentDatetime(eventDeadlineDatetimeMillis, judgment_days_before),
  }
}

export class MinimumParticipantsSaveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MinimumParticipantsSaveError'
  }
}

/**
 * 保存前に minimum_participants を検証・正規化する。
 * - OFF（undefined）: フィールド削除用に undefined のまま
 * - ON: judgment_datetime を再計算し enabled: true のオブジェクトを event にセット
 */
export function applyMinimumParticipantsForEventSave(
  event: Pick<Event, 'event_deadline_datetime' | 'event_max_people' | 'minimum_participants'>,
  nowMillis: number = Date.now(),
): void {
  const mp = event.minimum_participants
  if (mp == null) {
    return
  }

  if (!Number.isInteger(mp.count) || mp.count < 1 || mp.count > 5) {
    throw new MinimumParticipantsSaveError('最小催行人数は 1〜5 で指定してください')
  }
  if (!Number.isInteger(mp.judgment_days_before) || mp.judgment_days_before < 1 || mp.judgment_days_before > 5) {
    throw new MinimumParticipantsSaveError('判断日は注文期限の 1〜5 日前から選んでください')
  }
  if (mp.count > event.event_max_people) {
    throw new MinimumParticipantsSaveError('最小催行人数は定員以下にしてください')
  }

  const judgment_datetime = computeMinimumParticipantsJudgmentDatetime(
    event.event_deadline_datetime,
    mp.judgment_days_before,
  )
  if (judgment_datetime < nowMillis) {
    throw new MinimumParticipantsSaveError('判断日時が過去のため保存できません。注文期限または判断日を見直してください')
  }

  event.minimum_participants = {
    enabled: true,
    count: mp.count,
    judgment_days_before: mp.judgment_days_before,
    judgment_evaluated_at: mp.judgment_evaluated_at,
    judgment_datetime,
  }
}

export function isMinimumParticipantsEditingAllowed(rawEventStatus: RawEventStatusType): boolean {
  return rawEventStatus === 'in_draft' || rawEventStatus === 'applying_reservation'
}
