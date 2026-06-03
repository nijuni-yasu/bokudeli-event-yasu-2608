import { describe, expect, it, vi, beforeEach } from 'vitest'

const memberOrdersGetMock = vi.fn()
const getEventsInCommunitiesMock = vi.fn()

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collectionGroup: () => ({
      where: vi.fn().mockReturnThis(),
      withConverter: () => ({
        get: () => memberOrdersGetMock(),
      }),
    }),
  }),
  Timestamp: {
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}))

vi.mock('./event.js', () => ({
  getCommunityEventKey: (communityId: string, eventId: string) => `${communityId}\t${eventId}`,
  getEventsInCommunities: (...args: unknown[]) => getEventsInCommunitiesMock(...args),
}))

import { countParticipatedEventsForUser } from './memberOrder.js'

beforeEach(() => {
  memberOrdersGetMock.mockReset()
  getEventsInCommunitiesMock.mockReset()
})

describe('countParticipatedEventsForUser', () => {
  it('空 userId のときは 0', async () => {
    expect(await countParticipatedEventsForUser('')).toBe(0)
    expect(memberOrdersGetMock).not.toHaveBeenCalled()
  })

  it('ordered が無いときは 0', async () => {
    memberOrdersGetMock.mockResolvedValueOnce({ docs: [] })
    expect(await countParticipatedEventsForUser('uid-1')).toBe(0)
  })

  it('event_canceled と is_deleted を除外する（RC-57）', async () => {
    memberOrdersGetMock.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            community_id: 'c1',
            event_id: 'e1',
            user_id: 'uid-1',
            status: 'ordered',
          }),
        },
        {
          data: () => ({
            community_id: 'c1',
            event_id: 'e2',
            user_id: 'uid-1',
            status: 'ordered',
          }),
        },
        {
          data: () => ({
            community_id: 'c2',
            event_id: 'e3',
            user_id: 'uid-1',
            status: 'ordered',
          }),
        },
      ],
    })

    const activeEvent = { is_deleted: false, isCanceled: () => false }
    const canceledEvent = { is_deleted: false, isCanceled: () => true }
    const deletedEvent = { is_deleted: true, isCanceled: () => false }

    getEventsInCommunitiesMock.mockResolvedValueOnce(
      new Map([
        ['c1\te1', activeEvent],
        ['c1\te2', canceledEvent],
        ['c2\te3', deletedEvent],
      ]),
    )

    expect(await countParticipatedEventsForUser('uid-1')).toBe(1)
    expect(getEventsInCommunitiesMock).toHaveBeenCalledWith([
      { community_id: 'c1', event_id: 'e1' },
      { community_id: 'c1', event_id: 'e2' },
      { community_id: 'c2', event_id: 'e3' },
    ])
  })
})
