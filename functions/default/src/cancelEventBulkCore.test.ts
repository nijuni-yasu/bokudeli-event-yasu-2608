import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

const getEventInCommunityMock = vi.fn()
const getOrdersMock = vi.fn()
const saveOrderMock = vi.fn()
const recalcEventMembersMock = vi.fn()
const revertEnterpriseSubsidyUsageOnCancelBulkMock = vi.fn()
const writeAuditLogMock = vi.fn()
const applyOrderCanceledSideEffectsMock = vi.fn()
const refundMemberOrdersStripeMock = vi.fn()
const sendEventBulkCancellationMailsMock = vi.fn()

vi.mock('./stores/event.js', () => ({
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
}))

vi.mock('./stores/memberOrder.js', () => ({
  getOrders: (...args: unknown[]) => getOrdersMock(...args),
  saveOrder: (...args: unknown[]) => saveOrderMock(...args),
}))

vi.mock('./utils/recalcEventMembers.js', () => ({
  recalcEventMembers: (...args: unknown[]) => recalcEventMembersMock(...args),
}))

vi.mock('./utils/enterpriseSubsidyOrders.js', () => ({
  getEventEnterpriseId: () => undefined,
  revertEnterpriseSubsidyUsageOnCancelBulk: (...args: unknown[]) =>
    revertEnterpriseSubsidyUsageOnCancelBulkMock(...args),
  sumEnterpriseSubsidyAmounts: () => 0,
}))

vi.mock('./utils/auditLog.js', () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}))

vi.mock('./orderCanceledSideEffects.js', () => ({
  applyOrderCanceledSideEffects: (...args: unknown[]) => applyOrderCanceledSideEffectsMock(...args),
}))

vi.mock('./utils/refundMemberOrdersStripe.js', () => ({
  refundMemberOrdersStripe: (...args: unknown[]) => refundMemberOrdersStripeMock(...args),
}))

vi.mock('./eventBulkCancellationMail.js', () => ({
  sendEventBulkCancellationMails: (...args: unknown[]) => sendEventBulkCancellationMailsMock(...args),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { cancelEventBulkCore } from './cancelEventBulkCore.js'

const stripe = {} as Stripe

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    community_id: 'comm1',
    id: 'evt1',
    is_deleted: false,
    event_payment: 'user_on_day',
    event_start_datetime: Date.now() + 86400000,
    event_status: { value: 'accepting_order', shop_comment: '' },
    calculatedEventStatus: 'accepting_order',
    members: [],
    event_name: 'Test',
    community_account: 'acc',
    fullAddress: 'addr',
    organizer_company: '',
    organizer_fullname: '',
    organizer_phone_personal: '',
    organizer_phone_company: '',
    organizer_email: '',
    community_name: 'CN',
    event_end_datetime: Date.now() + 3600000,
    updateEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  recalcEventMembersMock.mockResolvedValue({ updated: false, memberCount: 0 })
  getOrdersMock.mockResolvedValue([])
  refundMemberOrdersStripeMock.mockResolvedValue({ refunds: [], refundErrors: [] })
  sendEventBulkCancellationMailsMock.mockResolvedValue(undefined)
  applyOrderCanceledSideEffectsMock.mockResolvedValue(undefined)
})

describe('cancelEventBulkCore', () => {
  it('既に event_canceled なら冪等 return', async () => {
    getEventInCommunityMock.mockResolvedValue(
      makeEvent({
        event_status: { value: 'event_canceled', shop_comment: '' },
        calculatedEventStatus: 'event_canceled',
      }),
    )

    const result = await cancelEventBulkCore({
      community_id: 'comm1',
      event_id: 'evt1',
      cancel_reason: 'reason',
      canceled_by: 'system',
      initiator: 'minimum_participants',
      stripe,
    })

    expect(result).toEqual({ outcome: 'already_canceled' })
    expect(getOrdersMock).not.toHaveBeenCalled()
  })

  it('ordered 0 でもイベントを中止する', async () => {
    const event = makeEvent()
    getEventInCommunityMock.mockResolvedValue(event)

    const result = await cancelEventBulkCore({
      community_id: 'comm1',
      event_id: 'evt1',
      cancel_reason: 'reason',
      canceled_by: 'system',
      initiator: 'minimum_participants',
      stripe,
    })

    expect(result.outcome).toBe('canceled')
    expect(event.updateEvent).toHaveBeenCalled()
    expect(sendEventBulkCancellationMailsMock).toHaveBeenCalled()
  })

  it('user_advance で stripe_id が一部欠落なら中止しない', async () => {
    const event = makeEvent({ event_payment: 'user_advance' })
    getEventInCommunityMock.mockResolvedValue(event)
    getOrdersMock.mockResolvedValue([
      { id: 'o1', user_id: 'u1', status: 'ordered', stripe_id: 'stripe-1' },
      { id: 'o2', user_id: 'u2', status: 'ordered', stripe_id: null },
    ])

    await expect(
      cancelEventBulkCore({
        community_id: 'comm1',
        event_id: 'evt1',
        cancel_reason: 'reason',
        canceled_by: 'system',
        initiator: 'minimum_participants',
        stripe,
      }),
    ).rejects.toThrow('先払い注文に決済情報（stripe_id）が紐づいていません')

    expect(event.updateEvent).not.toHaveBeenCalled()
    expect(sendEventBulkCancellationMailsMock).not.toHaveBeenCalled()
  })
})
