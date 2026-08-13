import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityMember } from '@shokujii/common/schemas/CommunityMember.js'

const runTransactionMock = vi.fn()
const transactionGetMock = vi.fn()
const transactionSetMock = vi.fn()
const transactionCreateMock = vi.fn()

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
      if (name === 'enterprises') {
        return {
          doc: (enterpriseId: string) => ({
            collection: (sub: string) => {
              if (sub !== 'community_accounts') {
                throw new Error(`unexpected subcollection: ${sub}`)
              }
              return {
                doc: (account: string) => ({
                  path: `enterprises/${enterpriseId}/community_accounts/${account}`,
                }),
              }
            },
          }),
        }
      }
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
  transactionCreateMock.mockReset()
  queryChain.where.mockClear()
  queryChain.limit.mockClear()
  queryChain.withConverter.mockClear()

  transactionGetMock.mockResolvedValueOnce({ exists: false }).mockResolvedValue({ empty: true, docs: [] })
  runTransactionMock.mockImplementation(
    async (
      fn: (tx: {
        get: typeof transactionGetMock
        set: typeof transactionSetMock
        create: typeof transactionCreateMock
      }) => Promise<void>,
    ) => fn({ get: transactionGetMock, set: transactionSetMock, create: transactionCreateMock }),
  )
})

describe('createEnterpriseCommunityWithManager', () => {
  it('transaction 内で account キー・community・manager member を create/set する', async () => {
    const community = new ShokujiiCommunity('cid-1', {
      community_name: 'Team Lunch',
      community_account: 'team-lunch',
      enterprise_id: 'ent-a',
      created_at: 1000,
    })

    await createEnterpriseCommunityWithManager(community, 'mgr-1')

    expect(runTransactionMock).toHaveBeenCalledTimes(1)
    expect(transactionGetMock).toHaveBeenCalledTimes(2)
    expect(transactionCreateMock).toHaveBeenCalledTimes(1)
    expect(transactionCreateMock.mock.calls[0]?.[1]).toEqual({ community_id: 'cid-1' })
    expect(transactionSetMock).toHaveBeenCalledTimes(2)
    const memberArg = transactionSetMock.mock.calls[1]?.[1]
    expect(memberArg).toBeInstanceOf(CommunityMember)
    expect(memberArg?.roles).toEqual(['manager'])
  })

  it('account キー doc が既存なら CommunityAccountAlreadyExistsInEnterpriseError', async () => {
    transactionGetMock.mockReset()
    transactionGetMock.mockResolvedValueOnce({ exists: true })

    const community = new ShokujiiCommunity('cid-2', {
      community_account: 'taken',
      enterprise_id: 'ent-a',
    })

    await expect(createEnterpriseCommunityWithManager(community, 'mgr-1')).rejects.toBeInstanceOf(
      CommunityAccountAlreadyExistsInEnterpriseError,
    )
    expect(transactionCreateMock).not.toHaveBeenCalled()
    expect(transactionSetMock).not.toHaveBeenCalled()
  })

  it('同一 enterprise 内に既存アカウントがあると CommunityAccountAlreadyExistsInEnterpriseError', async () => {
    transactionGetMock.mockReset()
    const existing = new ShokujiiCommunity('existing', { community_account: 'taken' })
    transactionGetMock.mockResolvedValueOnce({ exists: false }).mockResolvedValueOnce({
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
    expect(transactionCreateMock).not.toHaveBeenCalled()
    expect(transactionSetMock).not.toHaveBeenCalled()
  })
})
