import { describe, expect, it } from 'vitest'
import { shouldShowPfEventParticipantsSection } from './eventParticipantsVisibility.js'

describe('shouldShowPfEventParticipantsSection', () => {
  it('enterprise イベントはしきい値に関係なく常に表示', () => {
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: 'ent-1', members_visible_min_count: 10 }, 0)).toBe(
      true,
    )
  })

  it('PF で members_visible_min_count 未設定は常時表示', () => {
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null }, 0)).toBe(true)
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null }, 2)).toBe(true)
  })

  it('PF でしきい値以上なら表示', () => {
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 3)).toBe(true)
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 5)).toBe(true)
  })

  it('PF でしきい値未満なら非表示', () => {
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 2)).toBe(false)
    expect(shouldShowPfEventParticipantsSection({ enterprise_id: null, members_visible_min_count: 3 }, 0)).toBe(false)
  })
})
