import { describe, expect, it } from 'vitest'
import { User } from './User.js'

describe('User', () => {
  it('カウント未設定の既存ドキュメントを 0 として読める（バックワード互換）', () => {
    const now = Date.now()
    const u = new User('uid-1', {
      user_name: 'taro',
      created_at: now,
    })
    expect(u.participated_event_count).toBe(0)
    expect(u.friend_count).toBe(0)
    expect(u.joined_community_count).toBe(0)
    expect(u.managed_community_count).toBe(0)
    expect(u.ordered_food_count).toBe(0)
    expect(u.counts_updated_at).toBeUndefined()
  })

  it('カウントを設定して読み書きできる', () => {
    const now = Date.now()
    const u = new User('uid-2', {
      user_name: 'hanako',
      created_at: now,
      participated_event_count: 3,
      friend_count: 5,
      joined_community_count: 2,
      managed_community_count: 1,
      ordered_food_count: 7,
      counts_updated_at: now,
    })
    expect(u.participated_event_count).toBe(3)
    expect(u.friend_count).toBe(5)
    expect(u.joined_community_count).toBe(2)
    expect(u.managed_community_count).toBe(1)
    expect(u.ordered_food_count).toBe(7)
    expect(u.counts_updated_at).toBe(now)
  })

  it('toFirestore でカウント未設定でも UserAppSchema 由来の default(0) で埋まり DbSchema を通る', () => {
    const u = new User('uid-3', {
      user_name: 'taro',
      created_at: Date.now(),
    })
    expect(u.isValidForDatabase()).toBe(true)
    const out = u.toFirestore()
    expect(out.user_id).toBe('uid-3')
    expect(out.participated_event_count).toBe(0)
    expect(out.friend_count).toBe(0)
    expect(out.joined_community_count).toBe(0)
    expect(out.managed_community_count).toBe(0)
    expect(out.ordered_food_count).toBe(0)
  })

  it('toFirestore でカウントを設定すると DbSchema にも反映される', () => {
    const u = new User('uid-4', {
      user_name: 'taro',
      created_at: Date.now(),
      friend_count: 10,
    })
    const out = u.toFirestore()
    expect(out.friend_count).toBe(10)
  })

  it('負の値は弾かれる', () => {
    expect(
      () =>
        new User('uid-5', {
          user_name: 'taro',
          created_at: Date.now(),
          friend_count: -1,
        }),
    ).toThrow()
  })
})
