import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserFriend } from '@shokujii/common/schemas/UserFriend.js'
import type { EventHistoryEntry } from './friendsService.js'

const runTransactionMock = vi.fn()
const getUserFriendMock = vi.fn()
const saveUserFriendMock = vi.fn()
const deleteUserFriendMock = vi.fn()
const recountUserProfileCountsForUsersMock = vi.fn()

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  })),
  Timestamp: class Timestamp {},
}))

vi.mock('../stores/userFriend.js', () => ({
  getUserFriend: (...args: unknown[]) => getUserFriendMock(...args),
  saveUserFriend: (...args: unknown[]) => saveUserFriendMock(...args),
  deleteUserFriend: (...args: unknown[]) => deleteUserFriendMock(...args),
}))

vi.mock('./recountUserProfileCounts.js', () => ({
  recountUserProfileCountsForUsers: (...args: unknown[]) => recountUserProfileCountsForUsersMock(...args),
}))

vi.mock('./logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import {
  PAIR_TX_CONCURRENCY,
  addEventToFriendHistory,
  addEventToFriendHistoryForAnchor,
  recomputeDerived,
  removeEventFromFriendHistory,
} from './friendsService.js'
import { buildPairs } from './friendsPairUtils.js'

type FriendState = {
  history: EventHistoryEntry[]
  created_at: number
}

const friendState = new Map<string, FriendState>()

const stateKey = (uid: string, friendUid: string) => `${uid}:${friendUid}`

const setupTransaction = () => {
  runTransactionMock.mockImplementation(async (fn: (tx: object) => Promise<number>) => fn({}))
}

const readFriend = (uid: string, friendUid: string): FriendState | undefined =>
  friendState.get(stateKey(uid, friendUid))

beforeEach(() => {
  friendState.clear()
  runTransactionMock.mockReset()
  getUserFriendMock.mockReset()
  saveUserFriendMock.mockReset()
  deleteUserFriendMock.mockReset()
  recountUserProfileCountsForUsersMock.mockReset()
  recountUserProfileCountsForUsersMock.mockResolvedValue(undefined)

  setupTransaction()

  getUserFriendMock.mockImplementation(async (uid: string, friendUid: string) => {
    const existing = readFriend(uid, friendUid)
    if (existing == null) {
      return undefined
    }
    return new UserFriend(friendUid, {
      first_met_at: existing.history[0]?.event_at ?? Date.now(),
      last_met_at: existing.history[existing.history.length - 1]?.event_at ?? Date.now(),
      meet_count: new Set(existing.history.map((e) => e.event_id)).size,
      event_history: existing.history,
      created_at: existing.created_at,
    })
  })

  saveUserFriendMock.mockImplementation(async (uid: string, friend: UserFriend) => {
    friendState.set(stateKey(uid, friend.id), {
      history: friend.event_history as EventHistoryEntry[],
      created_at: friend.created_at,
    })
  })

  deleteUserFriendMock.mockImplementation(async (uid: string, friendUid: string) => {
    friendState.delete(stateKey(uid, friendUid))
  })
})

describe('recomputeDerived', () => {
  it('returns undefined for empty history', () => {
    expect(recomputeDerived([])).toBeUndefined()
  })

  it('calculates derived fields from single entry', () => {
    const result = recomputeDerived([
      {
        event_id: 'e1',
        community_id: 'c1',
        event_at: 1700000000000,
      },
    ])
    expect(result).toEqual({
      first_met_at: 1700000000000,
      last_met_at: 1700000000000,
      meet_count: 1,
    })
  })

  it('uses min/max event_at and unique event_id count', () => {
    const result = recomputeDerived([
      { event_id: 'e2', community_id: 'c1', event_at: 1702000000000 },
      { event_id: 'e1', community_id: 'c1', event_at: 1700000000000 },
      { event_id: 'e2', community_id: 'c1', event_at: 1703000000000 },
      { event_id: 'e3', community_id: 'c2', event_at: 1701000000000 },
    ])
    expect(result).toEqual({
      first_met_at: 1700000000000,
      last_met_at: 1703000000000,
      meet_count: 3,
    })
  })
})

describe('addEventToFriendHistoryForAnchor', () => {
  const baseInput = {
    event_id: 'ev1',
    community_id: 'comm1',
    event_at: 1700000000000,
  }

  it('updates only anchor-to-counterpart pairs, not among counterparts', async () => {
    await addEventToFriendHistoryForAnchor({
      ...baseInput,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A', 'B', 'C'],
    })

    expect(runTransactionMock).toHaveBeenCalledTimes(3)
    expect(readFriend('X', 'A')?.history).toHaveLength(1)
    expect(readFriend('A', 'X')?.history).toHaveLength(1)
    expect(readFriend('B', 'C')).toBeUndefined()
    expect(readFriend('A', 'B')).toBeUndefined()
  })

  it('is idempotent for the same event_id', async () => {
    await addEventToFriendHistoryForAnchor({
      ...baseInput,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A'],
    })
    await addEventToFriendHistoryForAnchor({
      ...baseInput,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A'],
    })

    const history = readFriend('X', 'A')?.history ?? []
    expect(history).toHaveLength(1)
    expect(history[0].event_id).toBe('ev1')
    expect(recomputeDerived(history)?.meet_count).toBe(1)
  })

  it('recounts anchor and counterparts', async () => {
    await addEventToFriendHistoryForAnchor({
      ...baseInput,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A', 'B'],
    })
    expect(recountUserProfileCountsForUsersMock).toHaveBeenCalledWith(['X', 'A', 'B'])
  })
})

describe('addEventToFriendHistory (all pairs / backfill)', () => {
  it('processes all combinations for backfill', async () => {
    const userIds = ['A', 'B', 'C']
    await addEventToFriendHistory({
      event_id: 'ev1',
      community_id: 'comm1',
      event_at: 1700000000000,
      user_ids: userIds,
    })

    expect(runTransactionMock).toHaveBeenCalledTimes(buildPairs(userIds).length)
    expect(readFriend('A', 'B')?.history).toHaveLength(1)
    expect(readFriend('B', 'C')?.history).toHaveLength(1)
  })
})

describe('runPairsWithConcurrency', () => {
  const baseInput = {
    event_id: 'ev1',
    community_id: 'comm1',
    event_at: 1700000000000,
  }

  it('processes all pairs when count exceeds PAIR_TX_CONCURRENCY', async () => {
    const userIds = Array.from({ length: 6 }, (_, i) => `u${i}`)
    const expectedPairs = buildPairs(userIds).length
    expect(expectedPairs).toBeGreaterThan(PAIR_TX_CONCURRENCY)

    await addEventToFriendHistory({
      ...baseInput,
      user_ids: userIds,
    })

    expect(runTransactionMock).toHaveBeenCalledTimes(expectedPairs)
  })

  it('continues other pairs when one transaction fails', async () => {
    const originalGetUserFriend = getUserFriendMock.getMockImplementation()
    getUserFriendMock.mockImplementation(async (uid: string, friendUid: string) => {
      if (uid === 'X' && friendUid === 'B') {
        throw new Error('simulated transaction failure')
      }
      return originalGetUserFriend?.(uid, friendUid)
    })

    const updated = await addEventToFriendHistoryForAnchor({
      ...baseInput,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A', 'B', 'C'],
    })

    expect(runTransactionMock).toHaveBeenCalledTimes(3)
    expect(updated).toBeGreaterThan(0)
    expect(readFriend('X', 'A')).toBeDefined()
    expect(readFriend('X', 'C')).toBeDefined()
    expect(readFriend('X', 'B')).toBeUndefined()
  })
})

describe('removeEventFromFriendHistory', () => {
  it('removes event from anchor-counterpart pairs only', async () => {
    await addEventToFriendHistoryForAnchor({
      event_id: 'ev1',
      community_id: 'comm1',
      event_at: 1700000000000,
      anchor_user_id: 'X',
      counterpart_user_ids: ['A', 'B'],
    })

    runTransactionMock.mockClear()

    await removeEventFromFriendHistory({
      event_id: 'ev1',
      anchor_user_id: 'X',
      counterpart_user_ids: ['A', 'B'],
    })

    expect(runTransactionMock).toHaveBeenCalledTimes(2)
    expect(readFriend('X', 'A')).toBeUndefined()
    expect(readFriend('A', 'X')).toBeUndefined()
  })
})
