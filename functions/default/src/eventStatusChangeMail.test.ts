import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const getEventUrlForEventMock = vi.fn()
const loggerErrorMock = vi.fn()

vi.mock('./utils/urls.js', () => ({
  getEventUrlForEvent: (...args: unknown[]) => getEventUrlForEventMock(...args),
  getPartnerOrderUrl: () => 'https://example.com/partner/order',
}))

vi.mock('./stores/user.js', () => ({
  getUser: vi.fn(),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: (...args: unknown[]) => loggerErrorMock(...args),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { createTemplateDataForOrderDeadline } from './eventStatusChangeMail.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: 'ent-1',
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
  getEventUrlForEventMock.mockResolvedValue(null)
})

describe('createTemplateDataForOrderDeadline', () => {
  it('ホスト未解決 enterprise でも throw せず event_url を空で返す', async () => {
    const templateData = await createTemplateDataForOrderDeadline(createMockEvent())

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Enterprise host unresolved for event status change mail',
      expect.objectContaining({
        eventId: 'evt1',
        enterpriseId: 'ent-1',
      }),
    )
    expect(templateData.event_url).toBe('')
  })
})
