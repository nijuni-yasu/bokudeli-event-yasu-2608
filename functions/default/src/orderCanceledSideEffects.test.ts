import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShokujiiEvent } from './stores/event.js'

const recalcEventMembersMock = vi.fn()
const getOrdersMock = vi.fn()
const getMemberIdsMock = vi.fn()
const removeEventFromFriendHistoryMock = vi.fn()
const recountUserProfileCountsMock = vi.fn()

vi.mock('./utils/recalcEventMembers.js', () => ({
  recalcEventMembers: (...args: unknown[]) => recalcEventMembersMock(...args),
}))

vi.mock('./stores/memberOrder.js', () => ({
  getOrders: (...args: unknown[]) => getOrdersMock(...args),
  getMemberIds: (...args: unknown[]) => getMemberIdsMock(...args),
}))

vi.mock('./utils/friendsService.js', () => ({
  removeEventFromFriendHistory: (...args: unknown[]) => removeEventFromFriendHistoryMock(...args),
}))

vi.mock('./utils/recountUserProfileCounts.js', () => ({
  recountUserProfileCounts: (...args: unknown[]) => recountUserProfileCountsMock(...args),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { applyOrderCanceledSideEffects } from './orderCanceledSideEffects.js'

const event = {
  community_id: 'comm1',
  id: 'evt1',
} as ShokujiiEvent

beforeEach(() => {
  recalcEventMembersMock.mockReset()
  getOrdersMock.mockReset()
  getMemberIdsMock.mockReset()
  removeEventFromFriendHistoryMock.mockReset()
  recountUserProfileCountsMock.mockReset()

  recalcEventMembersMock.mockResolvedValue({ updated: false, memberCount: 0 })
  recountUserProfileCountsMock.mockResolvedValue(undefined)
})

describe('applyOrderCanceledSideEffects', () => {
  it('当該ユーザーに ordered が残るときは removeEventFromFriendHistory を呼ばない（RC-45）', async () => {
    getOrdersMock.mockResolvedValue([
      { user_id: 'user1', status: 'ordered' },
      { user_id: 'user2', status: 'ordered' },
    ])

    await applyOrderCanceledSideEffects({ event, userId: 'user1' })

    expect(removeEventFromFriendHistoryMock).not.toHaveBeenCalled()
    expect(getMemberIdsMock).not.toHaveBeenCalled()
    expect(recountUserProfileCountsMock).toHaveBeenCalledWith('user1')
  })

  it('当該ユーザーの ordered が 0 件のときだけ友人履歴を削除する', async () => {
    getOrdersMock.mockResolvedValue([{ user_id: 'user2', status: 'ordered' }])
    getMemberIdsMock.mockResolvedValue(['user1', 'user2', 'user3'])
    removeEventFromFriendHistoryMock.mockResolvedValue(2)

    await applyOrderCanceledSideEffects({ event, userId: 'user1' })

    expect(removeEventFromFriendHistoryMock).toHaveBeenCalledWith({
      event_id: 'evt1',
      anchor_user_id: 'user1',
      counterpart_user_ids: ['user2', 'user3'],
    })
    expect(recountUserProfileCountsMock).toHaveBeenCalledWith('user1')
  })
})
