import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { createModuleLogger } from './utils/logger.js'
import { syncChatMessageReactionSummary } from './stores/chatReaction.js'

const logger = createModuleLogger('onChatReactionWritten')

export const handleChatReactionWritten = async (roomId: string, messageId: string): Promise<void> => {
  try {
    await syncChatMessageReactionSummary(roomId, messageId)
  } catch (error) {
    logger.error('Failed to sync chat message reaction summary', { roomId, messageId, error })
    throw error
  }
}

export const onChatReactionWritten = onDocumentWritten(
  { document: 'chat_rooms/{roomId}/messages/{messageId}/reactions/{userId}', retry: true },
  async (event) => {
    const roomId = event.params.roomId
    const messageId = event.params.messageId
    await handleChatReactionWritten(roomId, messageId)
  },
)
