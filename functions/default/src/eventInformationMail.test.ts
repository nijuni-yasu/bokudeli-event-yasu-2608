import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const sendDynamicTemplateWithPersonalizationsMock = vi.fn()
const getAllAcceptingOrderEventsMock = vi.fn()

const mockUsers = vi.fn<() => AsyncGenerator<{ ok: true; value: Record<string, unknown> }>>()

vi.mock('./utils/sendgridBulk.js', () => ({
  sendDynamicTemplateWithPersonalizations: (...args: unknown[]) => sendDynamicTemplateWithPersonalizationsMock(...args),
}))

vi.mock('./stores/event.js', () => ({
  getAllAcceptingOrderEvents: (...args: unknown[]) => getAllAcceptingOrderEventsMock(...args),
}))

vi.mock('./stores/user.js', () => ({
  getAllUsers: () => mockUsers(),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
  DEFAULT_TO: 'preview@example.com',
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

import { createTemplateDataForEventInformation, sendEventInformationMail } from './eventInformationMail.js'

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
    event_max_people: 10,
    getOrders: vi.fn().mockResolvedValue([]),
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
  sendDynamicTemplateWithPersonalizationsMock.mockResolvedValue({
    batchesAttempted: 1,
    batchesSucceeded: 1,
    batchesFailed: 0,
    totalRecipientsAccepted: 1,
    errors: [],
  })
  getAllAcceptingOrderEventsMock.mockResolvedValue([
    createMockEvent({ id: 'pf', enterprise_id: null, event_name: 'PF Event' }),
  ])
})

describe('createTemplateDataForEventInformation', () => {
  it('エンプライベントを events 配列から除外する', async () => {
    getAllAcceptingOrderEventsMock.mockResolvedValue([
      createMockEvent({ id: 'pf', enterprise_id: null, event_name: 'PF Event' }),
      createMockEvent({ id: 'ent', enterprise_id: 'ent-a', event_name: 'Enterprise Event' }),
    ])

    const templateData = await createTemplateDataForEventInformation(Date.now())

    expect(templateData.events).toHaveLength(1)
    expect(templateData.events[0]?.event_name).toBe('PF Event')
  })
})

describe('sendEventInformationMail', () => {
  it('enterprise_id 付きユーザーを宛先から除外する', async () => {
    mockUsers.mockReturnValue(
      yieldUsers([
        { user_email: 'pf@example.com', user_name: 'PF User', enterprise_id: undefined },
        { user_email: 'ent@example.com', user_name: 'Enterprise User', enterprise_id: 'ent-a' },
      ]),
    )

    await sendEventInformationMail()

    expect(sendDynamicTemplateWithPersonalizationsMock).toHaveBeenCalledTimes(1)
    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.to).toBe('pf@example.com')
  })

  it('enterprise_id 未設定ユーザーは宛先に含める', async () => {
    mockUsers.mockReturnValue(
      yieldUsers([{ user_email: 'legacy@example.com', user_name: 'Legacy User', enterprise_id: undefined }]),
    )

    await sendEventInformationMail()

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.to).toBe('legacy@example.com')
  })

  it('停止済み従業員（enterprise_id 残存）も宛先から除外する', async () => {
    mockUsers.mockReturnValue(
      yieldUsers([{ user_email: 'disabled@example.com', user_name: 'Disabled', enterprise_id: 'ent-a' }]),
    )

    await sendEventInformationMail()

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(0)
  })

  it('同一メールでも PF uid とエンプラ uid は users.enterprise_id で独立判定する', async () => {
    mockUsers.mockReturnValue(
      yieldUsers([
        { user_email: 'shared@example.com', user_name: 'PF', enterprise_id: undefined },
        { user_email: 'shared@example.com', user_name: 'Enterprise', enterprise_id: 'ent-a' },
      ]),
    )

    await sendEventInformationMail()

    const recipients = sendDynamicTemplateWithPersonalizationsMock.mock.calls[0]?.[1] as { to: string }[]
    expect(recipients).toHaveLength(1)
    expect(recipients[0]?.to).toBe('shared@example.com')
  })

  it('PF イベントが 0 件のとき SendGrid を呼ばない', async () => {
    getAllAcceptingOrderEventsMock.mockResolvedValue([
      createMockEvent({ enterprise_id: 'ent-a', event_name: 'Enterprise Only' }),
    ])
    mockUsers.mockReturnValue(yieldUsers([]))

    await sendEventInformationMail()

    expect(sendDynamicTemplateWithPersonalizationsMock).not.toHaveBeenCalled()
  })
})
