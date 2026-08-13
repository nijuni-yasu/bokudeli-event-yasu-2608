import { beforeEach, describe, expect, it, vi } from 'vitest'

const { HttpsError } = vi.hoisted(() => {
  class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  }
  return { HttpsError }
})

const hasRoleMock = vi.fn()
const generateInvitationUrlForManagerMock = vi.fn()

vi.mock('firebase-functions/https', () => ({
  HttpsError,
  onCall: (handler: unknown) => handler,
}))

vi.mock('./stores/community.js', () => ({
  getCommunity: vi.fn(),
  getCommunityByAccount: vi.fn(),
}))

vi.mock('./stores/config.js', () => ({
  getConfigGlobal: vi.fn(),
}))

import { getCommunity } from './stores/community.js'
import { getConfigGlobal } from './stores/config.js'
import { getInvitationUrlForCommunityManager } from './communityManager.js'

const callGetInvitationUrl = getInvitationUrlForCommunityManager as unknown as (request: {
  auth: { uid: string }
  data: { communityId: string }
}) => Promise<unknown>

beforeEach(() => {
  vi.mocked(getConfigGlobal).mockResolvedValue({ isSupport: () => false } as never)
  hasRoleMock.mockResolvedValue(false)
  generateInvitationUrlForManagerMock.mockResolvedValue('https://example.com/invite')
  vi.mocked(getCommunity).mockResolvedValue({
    hasRole: hasRoleMock,
    generateInvitationUrlForManager: generateInvitationUrlForManagerMock,
  } as never)
})

describe('getInvitationUrlForCommunityManager', () => {
  it('manager でも support でもない場合は permission-denied', async () => {
    await expect(
      callGetInvitationUrl({
        auth: { uid: 'attacker' },
        data: { communityId: 'community-1' },
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    expect(generateInvitationUrlForManagerMock).not.toHaveBeenCalled()
    expect(hasRoleMock).toHaveBeenCalledWith('attacker', 'manager')
  })

  it('manager の場合は招待 URL を返す', async () => {
    hasRoleMock.mockResolvedValue(true)

    await expect(
      callGetInvitationUrl({
        auth: { uid: 'manager-1' },
        data: { communityId: 'community-1' },
      }),
    ).resolves.toBe('https://example.com/invite')
  })
})
