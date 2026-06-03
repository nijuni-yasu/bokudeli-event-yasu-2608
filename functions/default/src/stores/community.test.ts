import { describe, expect, it, vi, beforeEach } from 'vitest'

const communitiesCountGetMock = vi.fn()

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => {
      if (name !== 'communities') {
        throw new Error(`unexpected collection: ${name}`)
      }
      return {
        where: vi.fn().mockReturnThis(),
        count: () => ({
          get: () => communitiesCountGetMock(),
        }),
      }
    },
  }),
}))

vi.mock('./user.js', () => ({
  getUserRef: (userId: string) => `users/${userId}`,
}))

import { countJoinedCommunitiesForUser, countManagedCommunitiesForUser } from './community.js'

beforeEach(() => {
  communitiesCountGetMock.mockReset()
  communitiesCountGetMock.mockResolvedValue({ data: () => ({ count: 3 }) })
})

describe('countJoinedCommunitiesForUser', () => {
  it('空 userId のときは 0', async () => {
    const result = await countJoinedCommunitiesForUser('')
    expect(result).toBe(0)
    expect(communitiesCountGetMock).not.toHaveBeenCalled()
  })

  it('communities.members の count 集計を使う', async () => {
    const result = await countJoinedCommunitiesForUser('uid-1')
    expect(result).toBe(3)
    expect(communitiesCountGetMock).toHaveBeenCalledTimes(1)
  })
})

describe('countManagedCommunitiesForUser', () => {
  it('空 userId のときは 0', async () => {
    const result = await countManagedCommunitiesForUser('')
    expect(result).toBe(0)
    expect(communitiesCountGetMock).not.toHaveBeenCalled()
  })

  it('communities.managers の count 集計を使う', async () => {
    const result = await countManagedCommunitiesForUser('uid-2')
    expect(result).toBe(3)
    expect(communitiesCountGetMock).toHaveBeenCalledTimes(1)
  })
})
