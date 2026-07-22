import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sendDynamicTemplateWithPersonalizationsMock = vi.fn()
const getAcceptingOrderEventsByTimeMock = vi.fn()
const getCommunityEmailsForEventMock = vi.fn()
const getEventMemberEmailsMock = vi.fn()
const getCommunityMemberEmailsExcludingOrderedMock = vi.fn()
const getEventPartnerShopMock = vi.fn()
const createOrdersForOrderDeadlineMock = vi.fn()

vi.mock('./utils/sendgridBulk.js', () => ({
  sendDynamicTemplateWithPersonalizations: (...args: unknown[]) => sendDynamicTemplateWithPersonalizationsMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAcceptingOrderEventsByTime: (...args: unknown[]) => getAcceptingOrderEventsByTimeMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  SUPPORT_MAIL: 'support@example.com',
  getCommunityEmailsForEvent: (...args: unknown[]) => getCommunityEmailsForEventMock(...args),
  getEventMemberEmails: (...args: unknown[]) => getEventMemberEmailsMock(...args),
  getCommunityMemberEmailsExcludingOrdered: (...args: unknown[]) =>
    getCommunityMemberEmailsExcludingOrderedMock(...args),
}))

vi.mock('./stores/partner.js', () => ({
  getEventPartnerShop: (...args: unknown[]) => getEventPartnerShopMock(...args),
}))

vi.mock('./utils/order.js', () => ({
  createOrdersForOrderDeadline: (...args: unknown[]) => createOrdersForOrderDeadlineMock(...args),
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example/${path}`,
  getEventUrl: () => 'https://example.com/event',
  getPartnerOrderUrl: () => 'https://example.com/partner/order',
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import {
  sendOrderDeadlineMailToMembers,
  sendOrderDeadlineMailToOrganizers,
  sendOrderDeadlineReminderToCommunityMembers,
} from './orderDeadlineMail.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: null,
    is_public: true,
    event_start_datetime: 1_700_000_000_000,
    event_end_datetime: 1_700_003_600_000,
    event_deadline_datetime: 1_699_900_000_000,
    event_name: 'Test Event',
    event_desc: 'desc',
    event_place: 'place',
    fullAddress: 'address',
    shop_name: 'shop',
    event_payment: 'user_advance',
    event_max_people: 10,
    organizer_fullname: 'Organizer',
    organizer_company: 'Company',
    organizer_email: 'org@example.com',
    organizer_phone_personal: '',
    organizer_phone_company: '',
    organizer_memo: '',
    getOrders: vi.fn().mockResolvedValue([]),
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
  getCommunityEmailsForEventMock.mockResolvedValue(['organizer@example.com'])
  getEventMemberEmailsMock.mockResolvedValue(['member@example.com'])
  getCommunityMemberEmailsExcludingOrderedMock.mockResolvedValue(['community@example.com'])
  getEventPartnerShopMock.mockResolvedValue({
    shop_email: 'shop@example.com',
    fullAddress: 'shop address',
    shop_phone: '000',
  })
  createOrdersForOrderDeadlineMock.mockResolvedValue([0, 0, []])
})

describe('sendOrderDeadlineReminderToCommunityMembers', () => {
  it('エンプライベントでは bulk 送信しない', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a', is_public: true })])

    await sendOrderDeadlineReminderToCommunityMembers(0, 1)

    expect(sendDynamicTemplateWithPersonalizationsMock).not.toHaveBeenCalled()
  })

  it('PF イベントでは bulk 送信する', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: null, is_public: true })])

    await sendOrderDeadlineReminderToCommunityMembers(0, 1)

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
  })
})

describe('sendOrderDeadlineMailToOrganizers', () => {
  it('エンプライベントでも bulk 送信する', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendOrderDeadlineMailToOrganizers(0, 1)

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
  })
})

describe('sendOrderDeadlineMailToMembers', () => {
  it('エンプライベントでも bulk 送信する', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendOrderDeadlineMailToMembers(0, 1)

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
  })
})
