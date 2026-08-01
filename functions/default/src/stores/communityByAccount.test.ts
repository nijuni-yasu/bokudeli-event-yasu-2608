import { beforeEach, describe, expect, it, vi } from 'vitest'

type WhereCall = { field: string; op: string; value: unknown }

const whereCalls: WhereCall[] = []
const queryGetMock = vi.fn()

function buildQueryChain() {
  const chain = {
    where(field: string, op: string, value: unknown) {
      whereCalls.push({ field, op, value })
      return chain
    },
    limit() {
      return chain
    },
    withConverter() {
      return chain
    },
    get: queryGetMock,
  }
  return chain
}

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => {
      if (name !== 'communities') {
        throw new Error(`unexpected collection: ${name}`)
      }
      return buildQueryChain()
    },
  }),
}))

import { getCommunityByAccountInEnterprise, getPfCommunityByAccount } from './community.js'

beforeEach(() => {
  whereCalls.length = 0
  queryGetMock.mockReset()
})

describe('getPfCommunityByAccount', () => {
  it('PF 名前空間（enterprise_id == null）で community_account を検索する', async () => {
    queryGetMock.mockResolvedValue({ empty: true, docs: [] })

    const result = await getPfCommunityByAccount('dev-lunch')

    expect(result).toBeUndefined()
    expect(whereCalls).toEqual([
      { field: 'enterprise_id', op: '==', value: null },
      { field: 'community_account', op: '==', value: 'dev-lunch' },
    ])
    expect(queryGetMock).toHaveBeenCalledTimes(1)
  })

  it('ヒット時は先頭 doc の data を返す', async () => {
    const communityData = { id: 'c-1', community_account: 'dev-lunch' }
    queryGetMock.mockResolvedValue({
      empty: false,
      docs: [{ data: () => communityData }],
    })

    const result = await getPfCommunityByAccount('dev-lunch')

    expect(result).toBe(communityData)
  })
})

describe('getCommunityByAccountInEnterprise', () => {
  it('指定 enterprise_id スコープで community_account を検索する', async () => {
    queryGetMock.mockResolvedValue({ empty: true, docs: [] })

    const result = await getCommunityByAccountInEnterprise('ent-a', 'dev-lunch')

    expect(result).toBeUndefined()
    expect(whereCalls).toEqual([
      { field: 'enterprise_id', op: '==', value: 'ent-a' },
      { field: 'community_account', op: '==', value: 'dev-lunch' },
    ])
  })
})
