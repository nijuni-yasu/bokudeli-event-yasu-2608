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

vi.mock('../stores/community.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../stores/community.js')>()
  return {
    ...actual,
    listCommunitiesByEnterpriseId: vi.fn(),
    getCommunityByAccountInEnterprise: vi.fn(),
    saveCommunity: vi.fn(),
    setCommunityMemberWithRoles: vi.fn(),
  }
})

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMembersCollectionRef: vi.fn(),
  getEnterpriseMemberUserIdByEmail: vi.fn(),
  getEnterpriseMember: vi.fn(),
}))

vi.mock('../utils/auditLog.js', () => ({
  writeAuditLog: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({ id: 'new-community-id' }),
    }),
  }),
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
  getClientIp: vi.fn(),
  normalizeEnterpriseEmail: (email: string) => email.trim().toLowerCase(),
}))

import {
  getCommunityByAccountInEnterprise,
  listCommunitiesByEnterpriseId,
  saveCommunity,
  setCommunityMemberWithRoles,
} from '../stores/community.js'
import {
  getEnterpriseMember,
  getEnterpriseMemberUserIdByEmail,
  getEnterpriseMembersCollectionRef,
} from '../stores/enterprise.js'
import { getUsersByUserIds, ShokujiiUser } from '../stores/user.js'
import { createEnterpriseCommunities, getEnterpriseCommunities } from './community.js'

const callGetEnterpriseCommunities = getEnterpriseCommunities as unknown as (request: {
  auth: { uid: string }
  data: { enterprise_id: string }
}) => Promise<{ communities: { manager_display_names?: string[] }[] }>

const callCreateEnterpriseCommunities = createEnterpriseCommunities as unknown as (request: {
  auth: { uid: string }
  data: {
    enterprise_id: string
    communities: { community_name: string; community_account: string; manager_email: string }[]
  }
  rawRequest: { ip?: string }
}) => Promise<{ success_count: number; results: { status: string; error_message?: string }[] }>

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

describe('createEnterpriseCommunities', () => {
  beforeEach(() => {
    vi.mocked(getEnterpriseMemberUserIdByEmail).mockResolvedValue('mgr-1')
    vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: true } as never)
    vi.mocked(getCommunityByAccountInEnterprise).mockResolvedValue(undefined)
    vi.mocked(saveCommunity).mockResolvedValue(undefined)
    vi.mocked(setCommunityMemberWithRoles).mockResolvedValue(undefined)
  })

  it('同一 enterprise 内に既存スラッグがあるとエラー', async () => {
    vi.mocked(getCommunityByAccountInEnterprise).mockResolvedValue({ id: 'existing' } as never)

    const result = await callCreateEnterpriseCommunities({
      auth: { uid: 'admin' },
      data: {
        enterprise_id: 'ent-a',
        communities: [
          {
            community_name: 'Dev Lunch',
            community_account: 'dev-lunch',
            manager_email: 'mgr@example.com',
          },
        ],
      },
      rawRequest: {},
    })

    expect(result.success_count).toBe(0)
    expect(result.results[0]?.error_message).toBe('このアカウント名は既に使用されています')
    expect(getCommunityByAccountInEnterprise).toHaveBeenCalledWith('ent-a', 'dev-lunch')
  })

  it('getCommunityByAccountInEnterprise が未使用なら PF 同スラッグでも作成できる', async () => {
    const result = await callCreateEnterpriseCommunities({
      auth: { uid: 'admin' },
      data: {
        enterprise_id: 'ent-b',
        communities: [
          {
            community_name: 'Dev Lunch',
            community_account: 'dev-lunch',
            manager_email: 'mgr@example.com',
          },
        ],
      },
      rawRequest: {},
    })

    expect(result.success_count).toBe(1)
    expect(getCommunityByAccountInEnterprise).toHaveBeenCalledWith('ent-b', 'dev-lunch')
  })
})
