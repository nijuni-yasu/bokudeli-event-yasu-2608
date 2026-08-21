import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'

const getDocMock = vi.hoisted(() => vi.fn())
const getDocsMock = vi.hoisted(() => vi.fn())
const onSnapshotMock = vi.hoisted(() => vi.fn())
const useUserStoreMock = vi.hoisted(() =>
  vi.fn((userId: string) => {
    void userId
    return { user: { user_name: 'Test User' } }
  }),
)
const mockEventRef = vi.hoisted(() => ({
  path: 'communities/community-a/events/event-a',
  parent: { parent: { id: 'community-a' } },
  withConverter: vi.fn(function (this: unknown) {
    return this
  }),
}))

vi.mock('@shokujii/base/stores/eventDraft.js', () => ({
  preparePfEventDraft: async () => {},
  prepareEnterpriseEventDraft: async () => {},
}))

vi.mock('@shokujii/base/utils/reportClientError.js', () => ({
  reportClientError: vi.fn(),
}))

vi.mock('@shokujii/base/utils/storage.js', () => ({
  convertStoragePathToURL: vi.fn(() => 'https://example.com/cover.jpg'),
  uploadImage: vi.fn(),
}))

vi.mock('@shokujii/base/utils/image.js', () => ({
  resizeImage: vi.fn(),
}))

vi.mock('@shokujii/base/apis/order.js', () => ({
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  confirmOrder: vi.fn(),
}))

vi.mock('@shokujii/base/apis/eventMenu.js', () => ({
  updateEventMenus: vi.fn(),
}))

vi.mock('@shokujii/base/apis/copyCommunityCoverToEvent.js', () => ({
  copyCommunityCoverToEvent: vi.fn(),
}))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    getDoc: (...args: unknown[]) => getDocMock(...args),
    getDocs: (...args: unknown[]) => getDocsMock(...args),
    onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
    collection: vi.fn(() => ({ withConverter: vi.fn(() => ({})) })),
    collectionGroup: vi.fn(() => ({})),
    query: vi.fn(() => ({
      withConverter: vi.fn(() => ({})),
    })),
    where: vi.fn(() => ({})),
    doc: vi.fn(() => ({
      withConverter: vi.fn(() => mockEventRef),
    })),
  }
})

vi.mock('@shokujii/base/firebase.js', () => ({
  db: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}))

vi.mock('@shokujii/base/stores/user.js', () => ({
  useUserStore: (userId: string) => useUserStoreMock(userId),
}))

import { fetchEventInCommunityDocument, useEventStore } from '@shokujii/base/stores/event.js'
import {
  buildEventStoreOptions,
  resolveEventStoreOptionsFromInjectedEnterpriseId,
} from '@shokujii/base/stores/eventStoreOptions.js'

describe('fetchEventInCommunityDocument', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('ドキュメントが存在するとき BokudeliEvent を返す', async () => {
    const event = { community_account: 'foo-community' } as BokudeliEvent
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => event,
    })

    await expect(fetchEventInCommunityDocument('community-a', 'event-a')).resolves.toBe(event)
    expect(getDocMock).toHaveBeenCalledWith(mockEventRef)
  })

  it('ドキュメントが存在しないとき undefined を返す', async () => {
    getDocMock.mockResolvedValue({
      exists: () => false,
    })

    await expect(fetchEventInCommunityDocument('community-a', 'missing-event')).resolves.toBeUndefined()
  })
})

describe('resolveEventStoreOptionsFromInjectedEnterpriseId', () => {
  it('非空 enterpriseId で tenant 固定 options を返す', () => {
    const options = resolveEventStoreOptionsFromInjectedEnterpriseId('ent-a')
    expect(options.eventsEnterpriseId).toBe('ent-a')
    expect(options.ordersEnterpriseId).toBe('ent-a')
    expect('draftPreparer' in options).toBe(true)
  })

  it('undefined は空オブジェクト（partner 無フィルタ / user default merge）', () => {
    const options = resolveEventStoreOptionsFromInjectedEnterpriseId(undefined)
    expect(options).toEqual({})
    expect('eventsEnterpriseId' in options).toBe(false)
  })

  it('空文字は空オブジェクト', () => {
    expect(resolveEventStoreOptionsFromInjectedEnterpriseId('')).toEqual({})
  })
})

describe('buildEventStoreOptions', () => {
  it('PF 明示は null キー付き', () => {
    const options = buildEventStoreOptions(undefined)
    expect(options.eventsEnterpriseId).toBeNull()
    expect('eventsEnterpriseId' in options).toBe(true)
  })
})

describe('useEventStore lazy members', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('document', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    getDocsMock.mockReset()
    onSnapshotMock.mockReset()
    useUserStoreMock.mockClear()
    getDocsMock.mockResolvedValue({
      docs: [{ ref: mockEventRef }],
    })
    onSnapshotMock.mockImplementation((_ref, callback) => {
      callback({
        ref: { path: mockEventRef.path },
        data: () =>
          ({
            members: ['user-a', 'user-b'],
          }) as BokudeliEvent,
      })
      return vi.fn()
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('members computed 未参照時は useUserStore を呼ばない', async () => {
    const store = useEventStore('event-a')
    await vi.waitFor(() => {
      expect(store.event?.members).toEqual(['user-a', 'user-b'])
    })
    expect(useUserStoreMock).not.toHaveBeenCalled()
  })

  it('members computed 初回評価時に member 数だけ useUserStore を呼ぶ', async () => {
    const store = useEventStore('event-b')
    await vi.waitFor(() => {
      expect(store.event?.members).toEqual(['user-a', 'user-b'])
    })

    const members = store.members
    expect(members).toHaveLength(2)
    expect(useUserStoreMock).toHaveBeenCalledTimes(2)
    expect(useUserStoreMock).toHaveBeenCalledWith('user-a')
    expect(useUserStoreMock).toHaveBeenCalledWith('user-b')
  })
})
