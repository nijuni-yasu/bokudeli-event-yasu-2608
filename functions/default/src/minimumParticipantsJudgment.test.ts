import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from 'firebase-admin/firestore'

const getEventInCommunityMock = vi.fn()
const getOrdersMock = vi.fn()
const applyBulkMock = vi.fn()
const syncMembersMock = vi.fn()

vi.mock('./stores/event.js', () => ({
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
}))

vi.mock('./stores/memberOrder.js', () => ({
  getOrders: (...args: unknown[]) => getOrdersMock(...args),
}))

vi.mock('./applyBulkEventCancelInTransaction.js', () => ({
  applyBulkEventCancelInTransaction: (...args: unknown[]) => applyBulkMock(...args),
  countUniqueOrderedUserIds: (orders: { user_id: string }[]) => new Set(orders.map((o) => o.user_id)).size,
  syncEventMembersFromOrderedInTransaction: (...args: unknown[]) => syncMembersMock(...args),
}))

vi.mock('@shokujii/common/utils/minimumParticipants.js', () => ({
  MINIMUM_PARTICIPANTS_CANCEL_REASON: '最小催行人数に達しなかったため自動中止',
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    runTransaction: async (fn: (tx: Transaction) => Promise<unknown>) => fn({} as Transaction),
  }),
}))

import { runMinimumParticipantsJudgmentTransaction } from './minimumParticipantsJudgment.js'

function makeEvent(overrides: Record<string, unknown> = {}) {
  const { calculatedEventStatus: calculatedEventStatusOverride, ...rest } = overrides
  const event = {
    community_id: 'comm1',
    id: 'evt1',
    is_deleted: false,
    event_status: { value: 'accepting_order', shop_comment: '' },
    members: [],
    minimum_participants: {
      enabled: true,
      count: 3,
      judgment_days_before: 1,
      judgment_datetime: Date.now(),
    },
    updateEvent: vi.fn().mockResolvedValue(undefined),
    updateMembersFieldOnly: vi.fn().mockResolvedValue(undefined),
    ...rest,
  }
  Object.defineProperty(event, 'calculatedEventStatus', {
    get: () => calculatedEventStatusOverride ?? 'accepting_order',
    configurable: true,
  })
  return event
}

beforeEach(() => {
  vi.clearAllMocks()
  syncMembersMock.mockResolvedValue(0)
  applyBulkMock.mockResolvedValue([])
})

describe('runMinimumParticipantsJudgmentTransaction', () => {
  it('ユニーク人数が閾値以上なら中止せず judgment_evaluated_at のみ', async () => {
    const event = makeEvent()
    getEventInCommunityMock.mockResolvedValue(event)
    getOrdersMock.mockResolvedValue([
      { id: 'o1', user_id: 'u1', status: 'ordered' },
      { id: 'o2', user_id: 'u2', status: 'ordered' },
      { id: 'o3', user_id: 'u3', status: 'ordered' },
    ])

    const result = await runMinimumParticipantsJudgmentTransaction({
      community_id: 'comm1',
      event_id: 'evt1',
      nowMillis: 1000,
    })

    expect(result.kind).toBe('continued')
    expect(applyBulkMock).not.toHaveBeenCalled()
    expect(event.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        minimum_participants: expect.objectContaining({ judgment_evaluated_at: 1000 }),
      }),
      'system',
      expect.anything(),
    )
  })

  it('calculatedEventStatus が order_closed なら中止せず judgment_evaluated_at のみ確定する', async () => {
    const event = makeEvent({ calculatedEventStatus: 'order_closed' })
    getEventInCommunityMock.mockResolvedValue(event)
    getOrdersMock.mockResolvedValue([{ id: 'o1', user_id: 'u1', status: 'ordered' }])

    const result = await runMinimumParticipantsJudgmentTransaction({
      community_id: 'comm1',
      event_id: 'evt1',
      nowMillis: 1000,
    })

    expect(result.kind).toBe('skipped')
    expect(applyBulkMock).not.toHaveBeenCalled()
    expect(getOrdersMock).not.toHaveBeenCalled()
    expect(event.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        minimum_participants: expect.objectContaining({ judgment_evaluated_at: 1000 }),
      }),
      'system',
      expect.anything(),
    )
  })

  it('calculatedEventStatus が finished なら中止せず judgment_evaluated_at のみ確定する', async () => {
    const event = makeEvent({ calculatedEventStatus: 'finished' })
    getEventInCommunityMock.mockResolvedValue(event)

    const result = await runMinimumParticipantsJudgmentTransaction({
      community_id: 'comm1',
      event_id: 'evt1',
      nowMillis: 2000,
    })

    expect(result.kind).toBe('skipped')
    expect(applyBulkMock).not.toHaveBeenCalled()
    expect(event.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        minimum_participants: expect.objectContaining({ judgment_evaluated_at: 2000 }),
      }),
      'system',
      expect.anything(),
    )
  })

  it('ユニーク人数が閾値未満なら一括中止する', async () => {
    const event = makeEvent()
    getEventInCommunityMock.mockResolvedValue(event)
    const ordered = [{ id: 'o1', user_id: 'u1', status: 'ordered' }]
    getOrdersMock.mockResolvedValue(ordered)
    applyBulkMock.mockResolvedValue([{ id: 'o1', user_id: 'u1', status: 'canceled' }])

    const result = await runMinimumParticipantsJudgmentTransaction({
      community_id: 'comm1',
      event_id: 'evt1',
      nowMillis: 1000,
    })

    expect(result.kind).toBe('canceled')
    // Transaction 内の read-after-write を避けるため、読み込み済みの Event / ordered を渡していること
    expect(applyBulkMock).toHaveBeenCalledWith(
      expect.objectContaining({ preloadedEvent: event, preloadedOrdered: ordered }),
    )
    // 再 read せず同一インスタンスで judgment_evaluated_at を確定していること
    expect(getEventInCommunityMock).toHaveBeenCalledTimes(1)
    expect(event.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        minimum_participants: expect.objectContaining({ judgment_evaluated_at: 1000 }),
      }),
      'system',
      expect.anything(),
    )
  })
})
