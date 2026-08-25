import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sgMailSendMock = vi.fn()
const getApplyingReservationEventsMock = vi.fn()
const getConfigGlobalMock = vi.fn()
const getEventPartnerShopMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getApplyingReservationEvents: (...args: unknown[]) => getApplyingReservationEventsMock(...args),
}))

vi.mock('./stores/config.js', () => ({
  getConfigGlobal: (...args: unknown[]) => getConfigGlobalMock(...args),
}))

vi.mock('./stores/partner.js', () => ({
  getEventPartnerShop: (...args: unknown[]) => getEventPartnerShopMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  SUPPORT_MAIL: 'support@example.com',
}))

vi.mock('./utils/urls.js', () => ({
  getEventUrl: () => 'https://example.com/event',
  getPartnerOrderUrl: () => 'https://example.com/partner/order',
}))

vi.mock('./utils/order.js', () => ({
  createOrdersForOrderDeadline: vi.fn().mockResolvedValue([1, 1000, []]),
}))

import { sendRejectOrderMailToShop } from './rejectOrderMail.js'

const DEADLINE_MILLIS = 1_700_000_000_000

function createMockEvent(applyingReservationUpdatedAt: number | null): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    event_start_datetime: DEADLINE_MILLIS + 10 * 24 * 60 * 60 * 1000,
    event_deadline_datetime: DEADLINE_MILLIS + 5 * 24 * 60 * 60 * 1000,
    event_name: 'Test Event',
    event_place: 'place',
    fullAddress: 'address',
    shop_name: 'shop',
    getLastUpdatedTimeByStatus: vi.fn().mockResolvedValue(applyingReservationUpdatedAt),
    updateEvent: vi.fn().mockResolvedValue(undefined),
  } as unknown as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  sgMailSendMock.mockResolvedValue(undefined)
  getConfigGlobalMock.mockResolvedValue({ system_id: 'system' })
  getEventPartnerShopMock.mockResolvedValue({
    getEmails: () => ['shop@example.com'],
  })
})

describe('sendRejectOrderMailToShop', () => {
  it('承認期限を過ぎた申請は経過時間に関わらず却下する', async () => {
    // 期限より 3 日前に申請 = 1 分窓を通過済みでも対象になる
    const event = createMockEvent(DEADLINE_MILLIS - 3 * 24 * 60 * 60 * 1000)
    getApplyingReservationEventsMock.mockResolvedValue([event])

    await sendRejectOrderMailToShop(DEADLINE_MILLIS)

    expect(event.updateEvent).toHaveBeenCalledWith({ event_status: { value: 'in_draft', shop_comment: '' } }, 'system')
    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
  })

  it('承認期限内の申請は却下しない', async () => {
    const event = createMockEvent(DEADLINE_MILLIS + 60 * 1000)
    getApplyingReservationEventsMock.mockResolvedValue([event])

    await sendRejectOrderMailToShop(DEADLINE_MILLIS)

    expect(event.updateEvent).not.toHaveBeenCalled()
    expect(sgMailSendMock).not.toHaveBeenCalled()
  })

  it('applying_reservation のログが無い場合は却下しない', async () => {
    const event = createMockEvent(null)
    getApplyingReservationEventsMock.mockResolvedValue([event])

    await sendRejectOrderMailToShop(DEADLINE_MILLIS)

    expect(event.updateEvent).not.toHaveBeenCalled()
    expect(sgMailSendMock).not.toHaveBeenCalled()
  })
})
