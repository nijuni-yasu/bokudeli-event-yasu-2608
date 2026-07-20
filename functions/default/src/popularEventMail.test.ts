import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sendDynamicTemplateWithPersonalizationsMock = vi.fn()
const getConfigGlobalMock = vi.fn()
const getEventInCommunityMock = vi.fn()
const saveEventMock = vi.fn()
const runTransactionMock = vi.fn()
const mockUsers = vi.fn<() => AsyncGenerator<{ ok: true; value: Record<string, unknown> }>>()

vi.mock('./utils/sendgridBulk.js', () => ({
  sendDynamicTemplateWithPersonalizations: (...args: unknown[]) => sendDynamicTemplateWithPersonalizationsMock(...args),
}))

vi.mock('./stores/config.js', () => ({
  getConfigGlobal: (...args: unknown[]) => getConfigGlobalMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
  saveEvent: (...args: unknown[]) => saveEventMock(...args),
}))

vi.mock('./stores/user.js', () => ({
  getAllUsers: () => mockUsers(),
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
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { trySendPopularEventMailAfterMembersSync } from './popularEventMail.js'

function createEligibleEvent(overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent {
  return {
    id: 'evt1',
    community_id: 'comm1',
    community_account: 'account',
    community_name: 'Community',
    enterprise_id: null,
    is_public: true,
    sent_popular_event_mail_at: undefined,
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
    event_max_people: 25,
    members: Array.from({ length: 10 }, (_, i) => `user${i}`),
    event_status: { value: 'accepting_order' },
    ...overrides,
  } as unknown as ShokujiiEvent
}

async function* yieldUsers(users: Array<{ user_email: string; user_name: string; enterprise_id?: string }>) {
  for (const user of users) {
    yield { ok: true as const, value: user }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsers.mockReturnValue(
    yieldUsers([
      { user_email: 'pf@example.com', user_name: 'PF User', enterprise_id: undefined },
      { user_email: 'ent@example.com', user_name: 'Enterprise User', enterprise_id: 'ent-a' },
    ]),
  )
  getConfigGlobalMock.mockResolvedValue({ popular_event_mail_threshold: 10 })
  getEventInCommunityMock.mockImplementation(async () => createEligibleEvent())
  runTransactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({}))
  saveEventMock.mockResolvedValue(undefined)
  sendDynamicTemplateWithPersonalizationsMock.mockResolvedValue({
    batchesAttempted: 1,
    batchesSucceeded: 1,
    batchesFailed: 0,
    totalRecipientsAccepted: 1,
    errors: [],
  })
})

describe('trySendPopularEventMailAfterMembersSync', () => {
  it('エンプライベントでは sent_popular_event_mail_at を更新せず送信しない', async () => {
    getEventInCommunityMock.mockImplementation(async () => createEligibleEvent({ enterprise_id: 'ent-a' }))

    await trySendPopularEventMailAfterMembersSync({
      communityId: 'comm1',
      eventId: 'evt1',
      triggerUserId: 'user1',
    })

    expect(saveEventMock).not.toHaveBeenCalled()
    expect(sendDynamicTemplateWithPersonalizationsMock).not.toHaveBeenCalled()
  })

  it('PF イベントではエンプラユーザーを宛先から除外して送信する', async () => {
    await trySendPopularEventMailAfterMembersSync({
      communityId: 'comm1',
      eventId: 'evt1',
      triggerUserId: 'user1',
    })

    expect(saveEventMock).toHaveBeenCalled()
    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.to).toBe('pf@example.com')
  })

  it('同一メールでも PF uid のみ宛先に含める', async () => {
    mockUsers.mockReturnValue(
      yieldUsers([
        { user_email: 'shared@example.com', user_name: 'PF', enterprise_id: undefined },
        { user_email: 'shared@example.com', user_name: 'Enterprise', enterprise_id: 'ent-a' },
      ]),
    )

    await trySendPopularEventMailAfterMembersSync({
      communityId: 'comm1',
      eventId: 'evt1',
      triggerUserId: 'user1',
    })

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.to).toBe('shared@example.com')
  })
})
