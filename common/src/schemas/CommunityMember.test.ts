import { describe, expect, it } from 'vitest'
import { CommunityMember, normalizeCommunityMemberRoles } from './CommunityMember.js'

describe('normalizeCommunityMemberRoles', () => {
  it('空・空白のみ・非文字列を除き、許可リストのみ残す（未知は黙って削除）', () => {
    expect(normalizeCommunityMemberRoles(['', 'manager', '', '  ', 1, null, undefined])).toEqual(['manager'])
    expect(normalizeCommunityMemberRoles(['', 'manager', '', 'unknown'])).toEqual(['manager'])
  })

  it('空配列や不正な入力は空配列になる', () => {
    expect(normalizeCommunityMemberRoles([''])).toEqual([])
    expect(normalizeCommunityMemberRoles(null)).toEqual([])
    expect(normalizeCommunityMemberRoles(undefined)).toEqual([])
  })
})

describe('CommunityMember', () => {
  it('コンストラクタで roles の空文字を正規化する', () => {
    // Firestore レガシー相当: roles に空文字のみ
    const m = new CommunityMember('u1', { roles: [''] as unknown as CommunityMember['roles'] })
    expect(m.roles).toEqual([])
  })

  it('toFirestore が roles に空文字があっても ZodError にならない', () => {
    const m = new CommunityMember('u1', { roles: ['', 'manager'] as unknown as CommunityMember['roles'] })
    const out = m.toFirestore()
    expect(out.roles).toEqual(['manager'])
  })

  it('許可外のみのときは空配列になり toFirestore は通る（未知は黙って削除）', () => {
    const m = new CommunityMember('u1', { roles: ['unknown'] as unknown as CommunityMember['roles'] })
    expect(m.roles).toEqual([])
    expect(m.toFirestore().roles).toEqual([])
  })
})
