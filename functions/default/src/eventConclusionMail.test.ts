import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sgMailSendMock = vi.fn()
const getAcceptingOrderEventsByEndTimeMock = vi.fn()
const getEventMemberEmailsMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAcceptingOrderEventsByEndTime: (...args: unknown[]) => getAcceptingOrderEventsByEndTimeMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  getEventMemberEmails: (...args: unknown[]) => getEventMemberEmailsMock(...args),
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example/${path}`,
  getEventUrl: () => 'https://example.com/event',
}))

import { sendEventConcludedMailToMembers } from './eventConclusionMail.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    is_public: true,
    enterprise_id: null,
    event_start_datetime: 1_700_000_000_000,
    event_name: 'Test Event',
    ...overrides,
  } as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  sgMailSendMock.mockResolvedValue(undefined)
  getEventMemberEmailsMock.mockResolvedValue(['member@example.com'])
})

describe('sendEventConcludedMailToMembers', () => {
  it('エンプライベントでは送信しない', async () => {
    getAcceptingOrderEventsByEndTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: 'ent-a' })])

    await sendEventConcludedMailToMembers(0, 1)

    expect(sgMailSendMock).not.toHaveBeenCalled()
  })

  it('PF イベントでは送信する', async () => {
    getAcceptingOrderEventsByEndTimeMock.mockResolvedValue([createMockEvent({ enterprise_id: null })])

    await sendEventConcludedMailToMembers(0, 1)

    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
  })
})
