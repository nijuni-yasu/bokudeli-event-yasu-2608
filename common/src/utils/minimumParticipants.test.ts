import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  applyMinimumParticipantsForEventSave,
  computeMinimumParticipantsJudgmentDatetime,
  createDefaultMinimumParticipants,
  MinimumParticipantsSaveError,
} from './minimumParticipants.js'
import { Event } from '../schemas/Event.js'

describe('computeMinimumParticipantsJudgmentDatetime', () => {
  it('Asia/Tokyo で days 分戻し、分 truncate する', () => {
    const deadline = DateTime.fromObject(
      { year: 2026, month: 3, day: 15, hour: 12, minute: 34, second: 59 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    const result = computeMinimumParticipantsJudgmentDatetime(deadline, 1)
    const expected = DateTime.fromObject(
      { year: 2026, month: 3, day: 14, hour: 12, minute: 34, second: 0 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    expect(result).toBe(expected)
  })
})

describe('applyMinimumParticipantsForEventSave', () => {
  const baseEvent = () => {
    const deadline = Date.now() + 7 * 24 * 60 * 60 * 1000
    return new Event('e1', {
      community_id: 'c1',
      community_name: 'C',
      community_account: 'acc',
      event_deadline_datetime: deadline,
      event_max_people: 10,
      minimum_participants: createDefaultMinimumParticipants(deadline),
    })
  }

  it('count > event_max_people ならエラー', () => {
    const event = baseEvent()
    event.minimum_participants!.count = 11
    expect(() => applyMinimumParticipantsForEventSave(event)).toThrow(MinimumParticipantsSaveError)
  })

  it('judgment_datetime が過去ならエラー', () => {
    const event = baseEvent()
    event.event_deadline_datetime = Date.now() + 60_000
    event.minimum_participants = createDefaultMinimumParticipants(event.event_deadline_datetime)
    expect(() => applyMinimumParticipantsForEventSave(event, Date.now() + 120_000)).toThrow(
      MinimumParticipantsSaveError,
    )
  })
})

describe('createDefaultMinimumParticipants', () => {
  it('デフォルト count=3, days=1', () => {
    const deadline = DateTime.now().plus({ days: 10 }).toMillis()
    const mp = createDefaultMinimumParticipants(deadline)
    expect(mp.count).toBe(3)
    expect(mp.judgment_days_before).toBe(1)
    expect(mp.enabled).toBe(true)
  })
})
