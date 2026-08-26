import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sgMailSendMock = vi.fn()
const getAcceptingOrderEventsByTimeMock = vi.fn()
const getApplyingReservationEventsMock = vi.fn()
const getCommunityEmailsForEventMock = vi.fn()
const getUserMock = vi.fn()
const getEventPartnerShopMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAcceptingOrderEventsByTime: (...args: unknown[]) => getAcceptingOrderEventsByTimeMock(...args),
  getApplyingReservationEvents: (...args: unknown[]) => getApplyingReservationEventsMock(...args),
}))

vi.mock('./utils/mail.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils/mail.js')>()
  return {
    ...original,
    DEFAULT_FROM: 'test@example.com',
    SUPPORT_MAIL: 'support@example.com',
    getCommunityEmailsForEvent: (...args: unknown[]) => getCommunityEmailsForEventMock(...args),
  }
})

vi.mock('./stores/user.js', () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example/${path}`,
  getEventUrl: () => 'https://example.com/event',
  getPartnerOrderUrl: () => 'https://example.com/partner/order',
  getManageEventMemberUrl: () => 'https://example.com/manage/members',
}))

vi.mock('./stores/partner.js', () => ({
  getEventPartnerShop: (...args: unknown[]) => getEventPartnerShopMock(...args),
}))

vi.mock('./utils/order.js', () => ({
  createOrdersForOrderDeadline: vi.fn().mockResolvedValue([1, 1000, []]),
}))

import { sendApplyingOrderRemindMailToShop, sendOrderRemindMailToOrganizer } from './orderRemindMail.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: null,
    event_start_datetime: 1_700_000_000_000,
    event_end_datetime: 1_700_003_600_000,
    event_deadline_datetime: 1_699_900_000_000,
    event_name: 'Test Event',
    event_desc: 'desc',
    event_place: 'place',
    fullAddress: 'address',
    shop_name: 'shop',
    organizer_fullname: 'Organizer',
    organizer_company: 'Company',
    organizer_email: 'org@example.com',
    organizer_phone_personal: '',
    organizer_phone_company: '',
    organizer_memo: '',
    hasOrderedOrders: vi.fn().mockResolvedValue(true),
    getOrders: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  sgMailSendMock.mockResolvedValue(undefined)
  getCommunityEmailsForEventMock.mockResolvedValue(['organizer@example.com'])
  getUserMock.mockResolvedValue({ user_name: 'Member' })
  getEventPartnerShopMock.mockResolvedValue({
    shop_email: 'shop@example.com',
    fullAddress: 'shop address',
    shop_phone: '000',
    getEmails: () => ['shop@example.com'],
  })
})

describe('sendOrderRemindMailToOrganizer', () => {
  it('エンプライベントでは送信しない', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendOrderRemindMailToOrganizer(0, 1, 5)

    expect(sgMailSendMock).not.toHaveBeenCalled()
  })

  it('PF イベントでは送信する', async () => {
    getAcceptingOrderEventsByTimeMock.mockResolvedValue([
      createMockEvent({
        enterprise_id: null,
        getOrders: vi.fn().mockResolvedValue([
          {
            user_id: 'user1',
            status: 'ordered',
            menu_name: 'Menu',
            menu_price: 1000,
          },
        ]),
      }),
    ])

    await sendOrderRemindMailToOrganizer(0, 1, 5)

    expect(getUserMock).toHaveBeenCalledWith('user1', false)
    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
  })
})

describe('sendApplyingOrderRemindMailToShop', () => {
  it('主催者メールを replyTo に設定して送信する', async () => {
    const updatedAt = 1_000
    getApplyingReservationEventsMock.mockResolvedValue([
      createMockEvent({
        getLastUpdatedTimeByStatus: vi.fn().mockResolvedValue(updatedAt),
      }),
    ])

    await sendApplyingOrderRemindMailToShop(updatedAt - 1, updatedAt + 1)

    expect(sgMailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'org@example.com',
      }),
    )
  })
})
