import { beforeEach, describe, expect, it, vi } from 'vitest'

const recalcCommunityMembersMock = vi.fn()
const getCommunityMock = vi.fn()
const sendCommunityManagerRoleChangeMailsMock = vi.fn()
const recountUserProfileCountsMock = vi.fn()

vi.mock('./utils/recalcCommunityMembers.js', () => ({
  recalcCommunityMembers: (...args: unknown[]) => recalcCommunityMembersMock(...args),
}))

vi.mock('./stores/community.js', () => ({
  getCommunity: (...args: unknown[]) => getCommunityMock(...args),
}))

vi.mock('./communityMail.js', () => ({
  sendCommunityManagerRoleChangeMails: (...args: unknown[]) => sendCommunityManagerRoleChangeMailsMock(...args),
}))

vi.mock('./utils/recountUserProfileCounts.js', () => ({
  recountUserProfileCounts: (...args: unknown[]) => recountUserProfileCountsMock(...args),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { handleCommunityMemberWritten } from './communityMemberCountsTrigger.js'

beforeEach(() => {
  vi.clearAllMocks()
  recalcCommunityMembersMock.mockResolvedValue({
    communityAccount: 'account',
    communityName: 'Community',
    addedManagerIds: ['user1'],
    removedManagerIds: [],
  })
  recountUserProfileCountsMock.mockResolvedValue(undefined)
  sendCommunityManagerRoleChangeMailsMock.mockResolvedValue(undefined)
})

describe('handleCommunityMemberWritten', () => {
  it('enterprise_id 付きコミュニティでは manager 変更メールを送信しない', async () => {
    getCommunityMock.mockResolvedValue({ enterprise_id: 'ent-a' })

    await handleCommunityMemberWritten('comm1', 'user1')

    expect(sendCommunityManagerRoleChangeMailsMock).not.toHaveBeenCalled()
    expect(recountUserProfileCountsMock).toHaveBeenCalledWith('user1')
  })

  it('PF コミュニティでは manager 変更メールを送信する', async () => {
    getCommunityMock.mockResolvedValue({ enterprise_id: null })

    await handleCommunityMemberWritten('comm1', 'user1')

    expect(sendCommunityManagerRoleChangeMailsMock).toHaveBeenCalledTimes(1)
  })

  it('空文字 enterprise_id のコミュニティでは manager 変更メールを送信する', async () => {
    getCommunityMock.mockResolvedValue({ enterprise_id: '' })

    await handleCommunityMemberWritten('comm1', 'user1')

    expect(sendCommunityManagerRoleChangeMailsMock).toHaveBeenCalledTimes(1)
  })
})
