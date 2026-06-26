import { describe, expect, it } from 'vitest'
import { Community } from './Community.js'

describe('Community enterprise_id', () => {
  it('toFirestore で enterprise_id 未設定時は null を明示保存する', () => {
    const community = new Community('community-1', {
      community_name: 'Test Community',
    })
    expect(community.isValidForDatabase()).toBe(true)
    const out = community.toFirestore()
    expect(out.enterprise_id).toBeNull()
  })

  it('toFirestore で enterprise_id string はそのまま保存する', () => {
    const community = new Community('community-1', {
      community_name: 'Enterprise Community',
      enterprise_id: 'ent-a',
    })
    const out = community.toFirestore()
    expect(out.enterprise_id).toBe('ent-a')
  })

  it('Firestore の enterprise_id: null を読み取れる', () => {
    const community = new Community('community-1', {
      community_name: 'PF Community',
      enterprise_id: null,
    })
    expect(community.enterprise_id).toBeNull()
  })
})
