import { describe, expect, it } from 'vitest'
import { shouldShowEventParticipantsSection } from './eventParticipantsVisibility.js'

describe('shouldShowEventParticipantsSection', () => {
  it('参加者 0 人のとき PF / enterprise とも非表示', () => {
    expect(shouldShowEventParticipantsSection({ enterprise_id: 'ent-1' }, 0)).toBe(false)
    expect(shouldShowEventParticipantsSection({ enterprise_id: null }, 0)).toBe(false)
    expect(shouldShowEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 0)).toBe(false)
  })

  it('enterprise イベントは 1 人以上ならしきい値に関係なく表示', () => {
    expect(shouldShowEventParticipantsSection({ enterprise_id: 'ent-1', members_visible_min_count: 10 }, 1)).toBe(true)
    expect(shouldShowEventParticipantsSection({ enterprise_id: 'ent-1' }, 2)).toBe(true)
  })

  it('PF で members_visible_min_count 未設定は 1 人以上で表示', () => {
    expect(shouldShowEventParticipantsSection({ enterprise_id: null }, 1)).toBe(true)
    expect(shouldShowEventParticipantsSection({ enterprise_id: null }, 2)).toBe(true)
  })

  it('PF でしきい値以上なら表示', () => {
    expect(shouldShowEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 3)).toBe(true)
    expect(shouldShowEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 5)).toBe(true)
  })

  it('PF でしきい値未満なら非表示', () => {
    expect(shouldShowEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 2)).toBe(false)
  })
})
