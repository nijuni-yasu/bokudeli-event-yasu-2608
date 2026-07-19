import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: vi.fn(),
}))

import { getEnterpriseMember } from '../stores/enterprise.js'
import { classifyEnterpriseFriend } from './enterpriseFriendVisibility.js'

const makeUser = (params: { userId: string; enterpriseId?: string | null; isDeleted?: boolean }) => ({
  user_id: params.userId,
  user_name: 'User',
  user_image_url: '',
  is_deleted: params.isDeleted ?? false,
  enterprise_id: params.enterpriseId,
})

describe('classifyEnterpriseFriend', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseMember).mockReset()
  })

  it('他社従業員は除外する', async () => {
    const result = await classifyEnterpriseFriend(
      makeUser({ userId: 'f1', enterpriseId: 'other-eid' }) as never,
      'my-eid',
    )
    expect(result).toEqual({ include: false })
    expect(getEnterpriseMember).not.toHaveBeenCalled()
  })

  it('退会ユーザーは除外する', async () => {
    const result = await classifyEnterpriseFriend(
      makeUser({ userId: 'f1', enterpriseId: 'my-eid', isDeleted: true }) as never,
      'my-eid',
    )
    expect(result).toEqual({ include: false })
  })

  it('PF ゲストは含め is_guest_friend / is_linkable false', async () => {
    const result = await classifyEnterpriseFriend(makeUser({ userId: 'guest', enterpriseId: null }) as never, 'my-eid')
    expect(result).toEqual({ include: true, is_guest_friend: true, is_linkable: false })
  })

  it('同社で is_active な従業員は通常返却', async () => {
    vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: true } as never)
    const result = await classifyEnterpriseFriend(
      makeUser({ userId: 'colleague', enterpriseId: 'my-eid' }) as never,
      'my-eid',
    )
    expect(result).toEqual({ include: true, is_guest_friend: false, is_linkable: true })
    expect(getEnterpriseMember).toHaveBeenCalledWith('my-eid', 'colleague')
  })

  it('同社でも member が inactive なら除外', async () => {
    vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)
    const result = await classifyEnterpriseFriend(
      makeUser({ userId: 'inactive', enterpriseId: 'my-eid' }) as never,
      'my-eid',
    )
    expect(result).toEqual({ include: false })
  })
})
