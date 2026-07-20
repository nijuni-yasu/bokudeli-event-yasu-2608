import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sgMailSendMock = vi.fn()
const getAcceptingOrderEventsBeforeDeadlineMock = vi.fn()
const getCommunityMock = vi.fn()
const getUserMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAcceptingOrderEventsBeforeDeadline: (...args: unknown[]) => getAcceptingOrderEventsBeforeDeadlineMock(...args),
}))

vi.mock('./stores/community.js', () => ({
  getCommunity: (...args: unknown[]) => getCommunityMock(...args),
}))

vi.mock('./stores/user.js', () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example/${path}`,
  getEventUrl: () => 'https://example.com/event',
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { sendUnorderedRemindMailToManagers } from './remindUnorderedMail.js'

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    enterprise_id: null,
    event_start_datetime: 1_700_000_000_000,
    event_end_datetime: 1_700_003_600_000,
    event_deadline_datetime: 1_800_000_000_000,
    event_name: 'Test Event',
    event_place: 'place',
    fullAddress: 'address',
    shop_name: 'shop',
    hasOrderedOrders: vi.fn().mockResolvedValue(false),
    getLastUpdatedTimeByStatus: vi.fn().mockResolvedValue(100),
    ...overrides,
  } as unknown as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  sgMailSendMock.mockResolvedValue(undefined)
  getCommunityMock.mockResolvedValue({
    getMembersByRole: vi.fn().mockResolvedValue([{ id: 'manager1' }]),
  })
  getUserMock.mockResolvedValue({
    user_email: 'manager@example.com',
    user_name: 'Manager',
  })
})

describe('sendUnorderedRemindMailToManagers', () => {
  it('エンプライベントでは送信しない', async () => {
    getAcceptingOrderEventsBeforeDeadlineMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendUnorderedRemindMailToManagers(Date.now(), 0, 1)

    expect(sgMailSendMock).not.toHaveBeenCalled()
  })

  it('PF イベントでリマインドウィンドウ一致時は送信する', async () => {
    const end = 2 * ONE_DAY_MILLIS + 1000
    const start = end - 60_000
    const updatedAt = start - 2 * ONE_DAY_MILLIS + 30_000

    getAcceptingOrderEventsBeforeDeadlineMock.mockResolvedValue([
      createMockEvent({
        enterprise_id: null,
        getLastUpdatedTimeByStatus: vi.fn().mockResolvedValue(updatedAt),
      }),
    ])

    await sendUnorderedRemindMailToManagers(end, start, end)

    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
  })
})
