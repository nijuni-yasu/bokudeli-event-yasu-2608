import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { orderBy, where } from 'firebase/firestore'

const getCountFromServerMock = vi.hoisted(() => vi.fn())
const getDocsMock = vi.hoisted(() => vi.fn())
const useCommunityStoreMock = vi.hoisted(() => vi.fn())

vi.mock('@shokujii/base/utils/reportClientError.js', () => ({
  reportClientError: vi.fn(),
}))

vi.mock('@shokujii/base/firebase.js', () => ({
  db: {},
}))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    getCountFromServer: (...args: unknown[]) => getCountFromServerMock(...args),
    getDocs: (...args: unknown[]) => getDocsMock(...args),
    collection: vi.fn(() => ({})),
    query: vi.fn(() => ({
      withConverter: vi.fn(() => ({})),
    })),
  }
})

vi.mock('@shokujii/base/stores/community.js', () => ({
  communityConverter: {},
  useCommunityStore: (community: { community_account: string }) => useCommunityStoreMock(community),
  BokudeliCommunity: class MockBokudeliCommunity {
    community_account: string
    community_name: string
    community_id: string

    constructor(communityId: string, src: { community_account: string; community_name: string }) {
      this.community_id = communityId
      this.community_account = src.community_account
      this.community_name = src.community_name
    }
  },
}))

import { buildCommunityListStoreId, useCommunityListStore } from '@shokujii/base/stores/communityList.js'

const createCommunityDoc = (communityAccount: string) => ({
  ref: { path: `communities/id-${communityAccount}` },
  data: () => ({
    community_id: `id-${communityAccount}`,
    community_account: communityAccount,
    community_name: `Community ${communityAccount}`,
  }),
})

describe('buildCommunityListStoreId', () => {
  it('lightweight 時は /lightweight サフィックスを付与する', () => {
    const filters = [where('is_public', '==', true), orderBy('community_num_members', 'desc')]
    expect(buildCommunityListStoreId(filters, 10, true)).toContain('/lightweight')
    expect(buildCommunityListStoreId(filters, 10, false)).not.toContain('/lightweight')
  })
})

describe('useCommunityListStore lightweight mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', {
      setTimeout: (callback: () => void) => {
        callback()
        return 0
      },
    })
    useCommunityStoreMock.mockImplementation((community: { community_account: string }) => ({
      community: { value: community },
    }))
    useCommunityStoreMock.mockClear()
    getCountFromServerMock.mockResolvedValue({ data: () => ({ count: 1 }) })
    getDocsMock.mockResolvedValue({
      docs: [createCommunityDoc('acme')],
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lightweight モードでは useCommunityStore を呼ばない', async () => {
    const filters = [where('is_public', '==', true), orderBy('community_num_members', 'desc')]
    const store = useCommunityListStore(filters, 5, { lightweight: true })

    await Promise.resolve()
    await Promise.resolve()

    expect(store.communities).toEqual([
      expect.objectContaining({
        community_account: 'acme',
        community_name: 'Community acme',
      }),
    ])
    expect(store.communityStores).toBeNull()
    expect(useCommunityStoreMock).not.toHaveBeenCalled()
  })

  it('通常モードでは useCommunityStore を呼ぶ', async () => {
    const filters = [where('is_public', '==', true), orderBy('community_num_members', 'desc')]
    const store = useCommunityListStore(filters, 5)

    await Promise.resolve()
    await Promise.resolve()

    expect(store.communityStores).toHaveLength(1)
    expect(store.communities).toBeNull()
    expect(useCommunityStoreMock).toHaveBeenCalledTimes(1)
  })
})
