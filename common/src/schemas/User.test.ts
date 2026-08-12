import { describe, expect, it } from 'vitest'
import { getDeleteFieldValue } from './firebase/index.js'
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

  it('プロフィール文字列フィールドが null でも読み込める（Issue #2145）', () => {
    const now = Date.now()
    const u = new User('uid-null-profile', {
      created_at: now,
      user_description: null,
      user_sns_facebook: null,
      user_sns_facebook_name: null,
      user_sns_twitter: null,
      user_sns_instagram: null,
      user_sns_website: null,
    } as unknown as Partial<User>)
    expect(u.user_description).toBe('')
    expect(u.user_sns_facebook).toBe('')
    expect(u.user_sns_facebook_name).toBe('')
    expect(u.user_sns_twitter).toBe('')
    expect(u.user_sns_instagram).toBe('')
    expect(u.user_sns_website).toBe('')
  })

  it('user_image_url が null のとき空文字に正規化される', () => {
    const u = new User('uid-null-image', {
      created_at: Date.now(),
      user_image_url: null,
    } as unknown as Partial<User>)
    expect(u.user_image_url).toBe('')
  })

  it('enterprise_id が null の PF ユーザー doc を読み込める', () => {
    const u = new User('uid-pf-null-ent', {
      created_at: Date.now(),
      user_name: 'PF',
      enterprise_id: null,
    } as unknown as Partial<User>)
    expect(u.enterprise_id).toBeUndefined()
  })

  it('enterprise_id が null の PF ユーザー doc を書き戻しても undefined キーが残らない', () => {
    const u = new User('uid-pf-null-ent-roundtrip', {
      created_at: Date.now(),
      user_name: 'PF',
      enterprise_id: null,
    } as unknown as Partial<User>)
    const out = u.toFirestore()
    expect('enterprise_id' in out).toBe(false)
    expect(Object.values(out).some((v) => v === undefined)).toBe(false)
  })

  it('enterprise_id を持つエンプラユーザーは書き戻しでも保持される', () => {
    const u = new User('uid-ent', {
      created_at: Date.now(),
      user_name: 'エンプラ',
      enterprise_id: 'ent-1',
    })
    expect(u.toFirestore().enterprise_id).toBe('ent-1')
  })

  it('null 正規化後の toFirestore でプロフィール optional フィールドは deleteField になる', () => {
    const u = new User('uid-null-roundtrip', {
      created_at: Date.now(),
      user_description: null,
      user_sns_facebook: null,
      user_sns_facebook_name: null,
      user_sns_twitter: null,
      user_sns_instagram: null,
      user_sns_website: null,
      user_image_url: null,
    } as unknown as Partial<User>)
    expect(u.isValidForDatabase()).toBe(true)
    const out = u.toFirestore()
    const deleteField = getDeleteFieldValue()
    expect(out.user_description).toEqual(deleteField)
    expect(out.user_sns_facebook).toEqual(deleteField)
    expect(out.user_sns_facebook_name).toEqual(deleteField)
    expect(out.user_sns_twitter).toEqual(deleteField)
    expect(out.user_sns_instagram).toEqual(deleteField)
    expect(out.user_sns_website).toEqual(deleteField)
    expect(out.user_image_url).toEqual(deleteField)
  })
})
