import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'

const getDocMock = vi.hoisted(() => vi.fn())
const mockEventRef = vi.hoisted(() => ({ path: 'communities/community-a/events/event-a' }))

vi.mock('@shokujii/base/stores/eventDraft.js', () => ({
  preparePfEventDraft: async () => {},
  prepareEnterpriseEventDraft: async () => {},
}))

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    getDoc: (...args: unknown[]) => getDocMock(...args),
    doc: vi.fn(() => ({
      withConverter: vi.fn(() => mockEventRef),
    })),
  }
})

vi.mock('@shokujii/base/firebase.js', () => ({
  db: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
}))

vi.mock('@shokujii/base/stores/user.js', () => ({
  useUserStore: () => ({}),
}))

import { fetchEventInCommunityDocument } from '@shokujii/base/stores/event.js'
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
