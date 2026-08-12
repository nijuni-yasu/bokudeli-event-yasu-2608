import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityMember } from '@shokujii/common/schemas/CommunityMember.js'

const runTransactionMock = vi.fn()
const transactionGetMock = vi.fn()
const transactionSetMock = vi.fn()

const queryChain = {
  where: vi.fn(),
  limit: vi.fn(),
  withConverter: vi.fn(),
}

queryChain.where.mockReturnValue(queryChain)
queryChain.limit.mockReturnValue(queryChain)
queryChain.withConverter.mockReturnValue(queryChain)

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    runTransaction: (...args: unknown[]) => runTransactionMock(...args),
    collection: (name: string) => {
      if (name !== 'communities') {
        throw new Error(`unexpected collection: ${name}`)
      }
      return {
        where: queryChain.where,
        doc: (id: string) => ({
          id,
          withConverter: () => ({
            path: `communities/${id}`,
          }),
          collection: (sub: string) => {
            if (sub !== 'members') {
              throw new Error(`unexpected subcollection: ${sub}`)
            }
            return {
              doc: (userId: string) => ({
                withConverter: () => ({
                  path: `communities/${id}/members/${userId}`,
                }),
              }),
            }
          },
        }),
      }
    },
  })),
}))

vi.mock('./user.js', () => ({
  getUserRef: (userId: string) => `users/${userId}`,
}))

import {
  CommunityAccountAlreadyExistsInEnterpriseError,
  createEnterpriseCommunityWithManager,
  ShokujiiCommunity,
} from './community.js'

beforeEach(() => {
  runTransactionMock.mockReset()
  transactionGetMock.mockReset()
  transactionSetMock.mockReset()
  queryChain.where.mockClear()
  queryChain.limit.mockClear()
  queryChain.withConverter.mockClear()

  transactionGetMock.mockResolvedValue({ empty: true, docs: [] })
  runTransactionMock.mockImplementation(
    async (fn: (tx: { get: typeof transactionGetMock; set: typeof transactionSetMock }) => Promise<void>) =>
      fn({ get: transactionGetMock, set: transactionSetMock }),
  )
})

describe('createEnterpriseCommunityWithManager', () => {
  it('transaction 内で community と manager member を set する', async () => {
    const community = new ShokujiiCommunity('cid-1', {
      community_name: 'Team Lunch',
      community_account: 'team-lunch',
      enterprise_id: 'ent-a',
      created_at: 1000,
    })

    await createEnterpriseCommunityWithManager(community, 'mgr-1')

    expect(runTransactionMock).toHaveBeenCalledTimes(1)
    expect(transactionGetMock).toHaveBeenCalledTimes(1)
    expect(transactionSetMock).toHaveBeenCalledTimes(2)
    const memberArg = transactionSetMock.mock.calls[1]?.[1]
    expect(memberArg).toBeInstanceOf(CommunityMember)
    expect(memberArg?.roles).toEqual(['manager'])
  })

  it('同一 enterprise 内に既存アカウントがあると CommunityAccountAlreadyExistsInEnterpriseError', async () => {
    const existing = new ShokujiiCommunity('existing', { community_account: 'taken' })
    transactionGetMock.mockResolvedValue({
      empty: false,
      docs: [{ data: () => existing }],
    })

    const community = new ShokujiiCommunity('cid-2', {
      community_account: 'taken',
      enterprise_id: 'ent-a',
    })

    await expect(createEnterpriseCommunityWithManager(community, 'mgr-1')).rejects.toBeInstanceOf(
      CommunityAccountAlreadyExistsInEnterpriseError,
    )
    expect(transactionSetMock).not.toHaveBeenCalled()
  })
})
