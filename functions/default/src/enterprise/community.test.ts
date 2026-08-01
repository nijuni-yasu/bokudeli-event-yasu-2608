import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: (...args: unknown[]) => (args.length === 1 ? args[0] : args[1]),
}))

vi.mock('../stores/community.js', () => ({
  listCommunitiesByEnterpriseId: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMembersCollectionRef: vi.fn(),
}))

vi.mock('../stores/user.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../stores/user.js')>()
  return {
    ...actual,
    getUsersByUserIds: vi.fn(),
  }
})

vi.mock('../utils/enterpriseAuthHelpers.js', () => ({
  assertEnterpriseAdmin: vi.fn(),
}))

import { listCommunitiesByEnterpriseId } from '../stores/community.js'
import { getEnterpriseMembersCollectionRef } from '../stores/enterprise.js'
import { getUsersByUserIds, ShokujiiUser } from '../stores/user.js'
import { getEnterpriseCommunities } from './community.js'

const callGetEnterpriseCommunities = getEnterpriseCommunities as unknown as (
  request: { auth: { uid: string }; data: { enterprise_id: string } },
) => Promise<{ communities: { manager_display_names?: string[] }[] }>

describe('getEnterpriseCommunities', () => {
  beforeEach(() => {
    vi.mocked(listCommunitiesByEnterpriseId).mockResolvedValue([
      {
        community_id: 'c1',
        community_name: 'Dev Lunch',
        community_account: 'dev-lunch',
        community_num_members: 3,
        created_at: 1000,
        manager_ids: ['mgr-1'],
      },
    ] as never)
    vi.mocked(getEnterpriseMembersCollectionRef).mockReturnValue({
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              user_id: 'mgr-1',
              display_name: '田中 太郎',
            }),
          },
        ],
      }),
    } as never)
  })

  it('manager_display_names は user_name を優先する', async () => {
    const user = new ShokujiiUser('mgr-1', { user_name: 'タロー' })
    vi.mocked(getUsersByUserIds).mockResolvedValue(new Map([['mgr-1', user]]))

    const result = await callGetEnterpriseCommunities({
      auth: { uid: 'admin' },
      data: { enterprise_id: 'ent-a' },
    })

    expect(result.communities[0]?.manager_display_names).toEqual(['タロー'])
  })

  it('user_name が空のとき display_name にフォールバックする', async () => {
    const user = new ShokujiiUser('mgr-1', { user_name: '' })
    vi.mocked(getUsersByUserIds).mockResolvedValue(new Map([['mgr-1', user]]))

    const result = await callGetEnterpriseCommunities({
      auth: { uid: 'admin' },
      data: { enterprise_id: 'ent-a' },
    })

    expect(result.communities[0]?.manager_display_names).toEqual(['田中 太郎'])
  })
})
