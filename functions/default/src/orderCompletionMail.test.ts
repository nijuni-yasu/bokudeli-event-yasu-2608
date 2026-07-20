import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sgMailSendMock = vi.fn()
const sendDynamicTemplateWithPersonalizationsMock = vi.fn()
const getUserMock = vi.fn()
const getUserPersonalInformationMock = vi.fn()
const getCommunityEmailsForEventMock = vi.fn()
const getCommunityMock = vi.fn()
const makeIcsMock = vi.fn()
const runTransactionMock = vi.fn()
const getEventInCommunityMock = vi.fn()
const saveEventMock = vi.fn()

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sgMailSendMock(...args),
}))

vi.mock('./utils/sendgridBulk.js', () => ({
  sendDynamicTemplateWithPersonalizations: (...args: unknown[]) => sendDynamicTemplateWithPersonalizationsMock(...args),
}))

vi.mock('./stores/user.js', () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
  getUserPersonalInformation: (...args: unknown[]) => getUserPersonalInformationMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  getCommunityEmailsForEvent: (...args: unknown[]) => getCommunityEmailsForEventMock(...args),
}))

vi.mock('./stores/community.js', () => ({
  getCommunity: (...args: unknown[]) => getCommunityMock(...args),
}))

vi.mock('./makeIcs.js', () => ({
  makeIcs: (...args: unknown[]) => makeIcsMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
  saveEvent: (...args: unknown[]) => saveEventMock(...args),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  }),
  Timestamp: {
    now: () => ({ toMillis: () => 1234567890 }),
  },
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example/${path}`,
  getEventUrl: () => 'https://example.com/event',
  getUserUrl: () => 'https://example.com/user',
  FIREBASE_STORAGE_BASE_URL: 'https://storage.example/',
}))

vi.mock('@shokujii/common/utils/buildThumbnailsLinks.js', () => ({
  getUserImageUrl: () => 'https://example.com/avatar.png',
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { sendOrderCompletionMails } from './orderCompletionMail.js'

function createMockEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: null,
    is_public: true,
    sent_new_event_mail_at: undefined,
    event_start_datetime: 1_700_000_000_000,
    event_end_datetime: 1_700_003_600_000,
    event_deadline_datetime: 1_699_900_000_000,
    event_name: 'Test Event',
    event_desc: 'desc',
    event_place: 'place',
    fullAddress: 'address',
    shop_name: 'shop',
    event_payment: 'user_advance',
    ...overrides,
  } as ShokujiiEvent
}

beforeEach(() => {
  vi.clearAllMocks()
  getUserPersonalInformationMock.mockResolvedValue({ user_email: 'member@example.com' })
  getUserMock.mockResolvedValue({
    user_id: 'user1',
    user_name: 'User',
    user_image_url: '',
  })
  getCommunityEmailsForEventMock.mockResolvedValue(['organizer@example.com'])
  makeIcsMock.mockResolvedValue(undefined)
  sgMailSendMock.mockResolvedValue(undefined)
  sendDynamicTemplateWithPersonalizationsMock.mockResolvedValue({
    batchesAttempted: 1,
    batchesSucceeded: 1,
    batchesFailed: 0,
    totalRecipientsAccepted: 1,
    errors: [],
  })
  getCommunityMock.mockResolvedValue({
    getMembers: vi.fn().mockResolvedValue([{ id: 'member1' }]),
  })
  getEventInCommunityMock.mockImplementation(async () => createMockEvent())
  runTransactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({}))
  saveEventMock.mockResolvedValue(undefined)
})

describe('sendOrderCompletionMails', () => {
  it('エンプライベントでは参加者 #1 のみ送信し #7 #6 をスキップする', async () => {
    const event = createMockEvent({ enterprise_id: 'ent-a' })
    getEventInCommunityMock.mockImplementation(async () => createMockEvent({ enterprise_id: 'ent-a' }))

    await sendOrderCompletionMails(event, 'user1')

    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
    expect(sendDynamicTemplateWithPersonalizationsMock).not.toHaveBeenCalled()
    expect(saveEventMock).not.toHaveBeenCalled()
    expect(getCommunityEmailsForEventMock).not.toHaveBeenCalled()
  })

  it('PF イベントでは参加者・主催者・新着通知を送信する', async () => {
    const event = createMockEvent({ enterprise_id: null })

    await sendOrderCompletionMails(event, 'user1')

    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(2)
    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ feature: 'orderCompletionOrganizers' }),
    )
    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ feature: 'newEventNotification' }),
    )
    expect(saveEventMock).toHaveBeenCalled()
  })

  it('エンプライベント内の PF uid でも #6 はイベント単位でスキップする', async () => {
    const event = createMockEvent({ enterprise_id: 'ent-a' })
    getEventInCommunityMock.mockImplementation(async () => createMockEvent({ enterprise_id: 'ent-a' }))

    await sendOrderCompletionMails(event, 'pf-user-without-enterprise-id')

    expect(sgMailSendMock).toHaveBeenCalledTimes(1)
    expect(sendDynamicTemplateWithPersonalizationsMock).not.toHaveBeenCalled()
    expect(saveEventMock).not.toHaveBeenCalled()
  })
})
