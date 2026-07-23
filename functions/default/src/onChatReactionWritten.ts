import { FieldValue } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { buildReactionSummary, normalizeReactionSummary } from '@shokujii/common/utils/chatReactionSummary.js'
import { createModuleLogger } from './utils/logger.js'
import { getChatMessage, getChatMessageRef } from './stores/chatMessage.js'
import { listChatReactions } from './stores/chatReaction.js'

const logger = createModuleLogger('onChatReactionWritten')

export const handleChatReactionWritten = async (roomId: string, messageId: string): Promise<void> => {
  const message = await getChatMessage(roomId, messageId)
  if (message == null) {
    logger.warn('Chat message not found for reaction trigger', { roomId, messageId })
    return
  }

  const reactions = await listChatReactions(roomId, messageId)
  const summary = normalizeReactionSummary(buildReactionSummary(reactions))

  const ref = getChatMessageRef(roomId, messageId)
  if (summary == null) {
    await ref.update({ reaction_summary: FieldValue.delete() })
    return
  }
  await ref.update({ reaction_summary: summary })
}

export const onChatReactionWritten = onDocumentWritten(
  { document: 'chat_rooms/{roomId}/messages/{messageId}/reactions/{userId}', retry: true },
  async (event) => {
    const roomId = event.params.roomId
    const messageId = event.params.messageId
    await handleChatReactionWritten(roomId, messageId)
  },
)
