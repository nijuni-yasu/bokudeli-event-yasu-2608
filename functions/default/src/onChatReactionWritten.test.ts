import { beforeEach, describe, expect, it, vi } from 'vitest'

const syncChatMessageReactionSummaryMock = vi.fn()

vi.mock('./stores/chatReaction.js', () => ({
  syncChatMessageReactionSummary: (...args: unknown[]) => syncChatMessageReactionSummaryMock(...args),
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
  syncChatMessageReactionSummaryMock.mockResolvedValue(undefined)
})

describe('handleChatReactionWritten', () => {
  it('syncs reaction_summary via transaction store', async () => {
    await handleChatReactionWritten('room1', 'msg1')

    expect(syncChatMessageReactionSummaryMock).toHaveBeenCalledWith('room1', 'msg1')
  })

  it('rethrows when sync fails for Cloud Functions retry', async () => {
    syncChatMessageReactionSummaryMock.mockRejectedValue(new Error('transaction failed'))

    await expect(handleChatReactionWritten('room1', 'msg1')).rejects.toThrow('transaction failed')
  })
})
