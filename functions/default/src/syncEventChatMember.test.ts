import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const { getEventInCommunityMock, runTransactionMock } = vi.hoisted(() => ({
  getEventInCommunityMock: vi.fn(),
  runTransactionMock: vi.fn(),
}))

vi.mock('./stores/event.js', () => ({
  getEventInCommunity: (...args: unknown[]) => getEventInCommunityMock(...args),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

vi.mock('./stores/user.js', () => ({
  getUser: vi.fn().mockResolvedValue({ user_name: 'Test User' }),
}))

vi.mock('./stores/chatRoom.js', () => ({
  buildEventRoomId: vi.fn(() => 'event_comm1_evt1'),
  createEventChatRoom: vi.fn((params: { memberUserIds: string[] }) => ({
    id: 'event_comm1_evt1',
    member_user_ids: params.memberUserIds,
    is_active: true,
  })),
  getChatRoom: vi.fn().mockResolvedValue(undefined),
  saveChatRoom: vi.fn(),
  updateChatRoomMembers: vi.fn(),
}))

vi.mock('./stores/chatMessage.js', () => ({
  addSystemChatMessage: vi.fn(() => ({ id: 'msg1' })),
  saveChatMessage: vi.fn(),
}))

vi.mock('./stores/chatMembership.js', () => ({
  createEventChatMembership: vi.fn(() => ({ room_id: 'event_comm1_evt1' })),
  getChatMembership: vi.fn().mockResolvedValue(undefined),
  deleteChatMembership: vi.fn(),
  saveChatMembership: vi.fn(),
  syncMembershipFromRoom: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    runTransaction: runTransactionMock,
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({ id: 'msg1' }),
        }),
      }),
    }),
  }),
}))

import { syncEventChatMember } from './syncEventChatMember.js'

const makeEvent = (overrides: Partial<ShokujiiEvent> = {}): ShokujiiEvent => {
  return {
    community_id: 'comm1',
    id: 'evt1',
    members: ['user1'],
    is_deleted: false,
    event_status: { value: 'accepting_order', updated_at: Date.now() },
    ...overrides,
  } as ShokujiiEvent
}

beforeEach(() => {
  getEventInCommunityMock.mockReset()
  runTransactionMock.mockReset()
  runTransactionMock.mockImplementation(async (fn: (tx: object) => Promise<void>) => fn({}))
})

describe('syncEventChatMember archived guard', () => {
  it('skips join when event is deleted', async () => {
    const event = makeEvent({ is_deleted: true })
    getEventInCommunityMock.mockResolvedValue(event)

    await syncEventChatMember({ event, userId: 'user1' })

    expect(runTransactionMock).not.toHaveBeenCalled()
  })

  it('skips join when event is canceled', async () => {
    const event = makeEvent({
      event_status: { value: 'event_canceled', updated_at: Date.now() },
    })
    getEventInCommunityMock.mockResolvedValue(event)

    await syncEventChatMember({ event, userId: 'user1' })

    expect(runTransactionMock).not.toHaveBeenCalled()
  })

  it('joins when event is active and user is a member', async () => {
    const event = makeEvent()
    getEventInCommunityMock.mockResolvedValue(event)

    await syncEventChatMember({ event, userId: 'user1' })

    expect(runTransactionMock).toHaveBeenCalled()
  })
})
