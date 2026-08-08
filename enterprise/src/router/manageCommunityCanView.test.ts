import { describe, expect, it } from 'vitest'
import { evaluateManageCommunityCanView } from '@/router/manageCommunityCanView.js'
import type { BokudeliCommunity } from '@shokujii/base/stores/community.js'

const communityWithManager = (managerId: string, enterpriseId: string | null = 'ent-1'): BokudeliCommunity => {
  return {
    enterprise_id: enterpriseId,
    managers: [{ id: managerId }],
  } as BokudeliCommunity
}

describe('evaluateManageCommunityCanView', () => {
  it('support は community 未読込でも true', () => {
    expect(
      evaluateManageCommunityCanView({
        config: {} as never,
        community: null,
        currentUserId: 'u1',
        enterpriseId: 'ent-1',
        isSupport: true,
      }),
    ).toBe(true)
  })

  it('community null のとき pending', () => {
    expect(
      evaluateManageCommunityCanView({
        config: {} as never,
        community: null,
        currentUserId: 'u1',
        enterpriseId: 'ent-1',
        isSupport: false,
      }),
    ).toBeNull()
  })

  it('別テナント community は false', () => {
    expect(
      evaluateManageCommunityCanView({
        config: {} as never,
        community: communityWithManager('u1', 'other-ent'),
        currentUserId: 'u1',
        enterpriseId: 'ent-1',
        isSupport: false,
      }),
    ).toBe(false)
  })

  it('管理者なら true', () => {
    expect(
      evaluateManageCommunityCanView({
        config: {} as never,
        community: communityWithManager('u1'),
        currentUserId: 'u1',
        enterpriseId: 'ent-1',
        isSupport: false,
      }),
    ).toBe(true)
  })
})
