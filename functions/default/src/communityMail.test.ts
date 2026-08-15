import { beforeEach, describe, expect, it, vi } from 'vitest'

const sgMailSendMock = vi.fn()
const getCommunityManagerEmailSetMock = vi.fn()
const getCommunityUrlForCommunityMock = vi.fn()
const getManageCommunityUrlForCommunityMock = vi.fn()
const loggerErrorMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  SUPPORT_MAIL: 'support@example.com',
  getCommunityManagerEmailSet: (...args: unknown[]) => getCommunityManagerEmailSetMock(...args),
}))

vi.mock('./utils/urls.js', () => ({
  getCommunityUrlForCommunity: (...args: unknown[]) => getCommunityUrlForCommunityMock(...args),
  getManageCommunityUrlForCommunity: (...args: unknown[]) => getManageCommunityUrlForCommunityMock(...args),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: (...args: unknown[]) => loggerErrorMock(...args),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { ShokujiiCommunity } from './stores/community.js'
import { sendCommunityAddedMailToOrganizer } from './communityMail.js'

const TEMPLATE_ID = 'd-d116c6b010214d2b92a2421411a508d2'

function createEnterpriseCommunity(): ShokujiiCommunity {
  return new ShokujiiCommunity('comm-1', {
    community_account: 'my-community',
    community_name: 'My Community',
    enterprise_id: 'ent-1',
    created_at: 1,
    updated_at: 1,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  sgMailSendMock.mockResolvedValue(undefined)
  getCommunityManagerEmailSetMock.mockResolvedValue(new Set(['organizer@example.com']))
  getCommunityUrlForCommunityMock.mockResolvedValue(null)
  getManageCommunityUrlForCommunityMock.mockResolvedValue(null)
})

describe('sendCommunityAddedMailToOrganizer', () => {
  it('ホスト未解決 enterprise でも空 URL で送信を継続する', async () => {
    await sendCommunityAddedMailToOrganizer(TEMPLATE_ID, createEnterpriseCommunity())

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Enterprise host unresolved for community added mail',
      expect.objectContaining({
        communityId: 'comm-1',
        enterpriseId: 'ent-1',
      }),
    )
    expect(sgMailSendMock).toHaveBeenCalledTimes(2)
    expect(sgMailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'organizer@example.com',
        dynamicTemplateData: expect.objectContaining({
          community_url: '',
          community_manage_url: '',
        }),
      }),
    )
  })
})
