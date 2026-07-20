import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sendDynamicTemplateWithPersonalizationsMock = vi.fn()
const getInCartMemberOrdersByUpdatedTimeMock = vi.fn()
const getOrdersInCartMock = vi.fn()
const getEventInCommunityMock = vi.fn()
const getAcceptingOrderEventsByTimeMock = vi.fn()
const getUserPersonalInformationMock = vi.fn()

vi.mock('./utils/sendgridBulk.js', () => ({
  sendDynamicTemplateWithPersonalizations: (...args: unknown[]) => sendDynamicTemplateWithPersonalizationsMock(...args),
}))

vi.mock('./stores/memberOrder.js', () => ({
  getInCartMemberOrdersByUpdatedTime: (...args: unknown[]) => getInCartMemberOrdersByUpdatedTimeMock(...args),
  getOrdersInCart: (...args: unknown[]) => getOrdersInCartMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAcceptingOrderEventsByTime: (...args: unknown[]) => getAcceptingOrderEventsByTimeMock(...args),
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
}))

vi.mock('./stores/user.js', () => ({
  getUserPersonalInformation: (...args: unknown[]) => getUserPersonalInformationMock(...args),
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

import { sendInCartEventDeadlineNotificationToMember, sendInCartNotificationToMember } from './inCartNotification.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: null,
    event_start_datetime: 1_700_000_000_000,
    event_end_datetime: 1_700_003_600_000,
    event_deadline_datetime: 1_800_000_000_000,
    event_name: 'Test Event',
    fullAddress: 'address',
    shop_name: 'shop',
    getOrders: vi.fn().mockResolvedValue([{ user_id: 'user1' }]),
    ...overrides,
  } as unknown as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  sendDynamicTemplateWithPersonalizationsMock.mockResolvedValue({
    batchesAttempted: 1,
    batchesSucceeded: 1,
    batchesFailed: 0,
    totalRecipientsAccepted: 1,
    errors: [],
  })
  getUserPersonalInformationMock.mockResolvedValue({ user_email: 'user@example.com' })
})

describe('sendInCartNotificationToMember', () => {
  it('エンプライベントでは bulk 送信しない', async () => {
    getInCartMemberOrdersByUpdatedTimeMock.mockResolvedValue([
      {
        community_id: 'comm1',
        event_id: 'evt1',
        user_id: 'user1',
        updated_at: 100,
      },
    ])
    getOrdersInCartMock.mockResolvedValue([{ updated_at: 100 }])
    getEventInCommunityMock.mockResolvedValue(createMockEvent({ enterprise_id: 'ent-a' }))

    await sendInCartNotificationToMember(0, 200)

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as unknown[]
    expect(recipients).toHaveLength(0)
  })

  it('PF イベントでは bulk 送信する', async () => {
    getInCartMemberOrdersByUpdatedTimeMock.mockResolvedValue([
      {
        community_id: 'comm1',
        event_id: 'evt1',
        user_id: 'user1',
        updated_at: 100,
      },
    ])
    getOrdersInCartMock.mockResolvedValue([{ updated_at: 100 }])
    getEventInCommunityMock.mockResolvedValue(createMockEvent({ enterprise_id: null }))

    await sendInCartNotificationToMember(0, 200)

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
  })
})

describe('sendInCartEventDeadlineNotificationToMember', () => {
  it('エンプライベントでは bulk 送信しない', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendInCartEventDeadlineNotificationToMember(0, 1)

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as unknown[]
    expect(recipients).toHaveLength(0)
  })

  it('PF イベントでは bulk 送信する', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: null })])

    await sendInCartEventDeadlineNotificationToMember(0, 1)

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
  })
})
