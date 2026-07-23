import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldValue } from 'firebase-admin/firestore'

const getChatMessageMock = vi.fn()
const listChatReactionsMock = vi.fn()
const updateMock = vi.fn()

vi.mock('./stores/chatMessage.js', () => ({
  getChatMessage: (...args: unknown[]) => getChatMessageMock(...args),
  getChatMessageRef: () => ({
    update: (...args: unknown[]) => updateMock(...args),
  }),
}))

vi.mock('./stores/chatReaction.js', () => ({
  listChatReactions: (...args: unknown[]) => listChatReactionsMock(...args),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { handleChatReactionWritten } from './onChatReactionWritten.js'

beforeEach(() => {
  vi.clearAllMocks()
  getChatMessageMock.mockResolvedValue({
    id: 'msg1',
    message_type: 'user',
  })
})

describe('handleChatReactionWritten', () => {
  it('updates reaction_summary from reactions subcollection', async () => {
    listChatReactionsMock.mockResolvedValue([{ emoji: '👍' }, { emoji: '👍' }, { emoji: '❤️' }])

    await handleChatReactionWritten('room1', 'msg1')

    expect(updateMock).toHaveBeenCalledWith({
      reaction_summary: { '👍': 2, '❤️': 1 },
    })
  })

  it('deletes reaction_summary when no reactions remain', async () => {
    listChatReactionsMock.mockResolvedValue([])

    await handleChatReactionWritten('room1', 'msg1')

    expect(updateMock).toHaveBeenCalledWith({
      reaction_summary: FieldValue.delete(),
    })
  })

  it('no-ops when message does not exist', async () => {
    getChatMessageMock.mockResolvedValue(undefined)

    await handleChatReactionWritten('room1', 'msg1')

    expect(listChatReactionsMock).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })
})
