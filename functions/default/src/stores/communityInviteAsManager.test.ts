import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpsError } from 'firebase-functions/https'

const runTransactionMock = vi.fn()
const transactionGetMock = vi.fn()
const transactionUpdateMock = vi.fn()
const transactionSetMock = vi.fn()

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    runTransaction: (...args: unknown[]) => runTransactionMock(...args),
    collection: (name: string) => {
      if (name !== 'communities') {
        throw new Error(`unexpected collection: ${name}`)
      }
      return {
        doc: (communityId: string) => ({
          withConverter: () => ({
            collection: (sub: string) => {
              if (sub !== 'members' && sub !== 'invites') {
                throw new Error(`unexpected subcollection: ${sub}`)
              }
              return {
                doc: (docId: string) => ({
                  withConverter: () => ({
                    path: `communities/${communityId}/${sub}/${docId}`,
                  }),
                }),
              }
            },
          }),
        }),
      }
    },
  })),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
  },
}))

import { ShokujiiCommunity } from './community.js'

describe('ShokujiiCommunity inviteAsManager', () => {
  beforeEach(() => {
    runTransactionMock.mockReset()
    transactionGetMock.mockReset()
    transactionUpdateMock.mockReset()
    transactionSetMock.mockReset()

    runTransactionMock.mockImplementation(async (callback: (transaction: unknown) => Promise<void>) => {
      await callback({
        get: transactionGetMock,
        update: transactionUpdateMock,
        set: transactionSetMock,
      })
    })
  })

  it('uses runTransaction for atomic invite redeem and manager grant', async () => {
    const nowMillis = Date.now()
    transactionGetMock
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          created_at: nowMillis,
          has_token_been_redeemed: false,
          inviter_id: 'inviter-1',
        }),
      })
      .mockResolvedValueOnce({
        exists: false,
      })

    const community = new ShokujiiCommunity('community-1', {})
    await community.inviteAsManager('user-1', 'token-1')

    expect(runTransactionMock).toHaveBeenCalledTimes(1)
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        has_token_been_redeemed: true,
      }),
    )
    expect(transactionSetMock).toHaveBeenCalledTimes(1)
  })

  it('throws when token is already redeemed inside transaction', async () => {
    const nowMillis = Date.now()
    transactionGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        created_at: nowMillis,
        has_token_been_redeemed: true,
        inviter_id: 'inviter-1',
      }),
    })

    const community = new ShokujiiCommunity('community-1', {})
    await expect(community.inviteAsManager('user-1', 'token-1')).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'The token has been redeemed.',
    })

    expect(transactionUpdateMock).not.toHaveBeenCalled()
    expect(transactionSetMock).not.toHaveBeenCalled()
  })

  it('throws when invitation does not exist', async () => {
    transactionGetMock.mockResolvedValueOnce({
      exists: false,
    })

    const community = new ShokujiiCommunity('community-1', {})
    await expect(community.inviteAsManager('user-1', 'token-1')).rejects.toBeInstanceOf(HttpsError)
    expect(transactionUpdateMock).not.toHaveBeenCalled()
    expect(transactionSetMock).not.toHaveBeenCalled()
  })
})
