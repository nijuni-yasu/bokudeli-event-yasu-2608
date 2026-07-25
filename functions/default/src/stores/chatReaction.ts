import {
  DocumentData,
  FieldValue,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { ChatReaction } from '@shokujii/common/schemas/ChatReaction.js'
import { buildReactionSummary, normalizeReactionSummary } from '@shokujii/common/utils/chatReactionSummary.js'
import { getChatMessageRef } from './chatMessage.js'

class ChatReactionConverter implements FirestoreDataConverter<ChatReaction> {
  toFirestore(reaction: ChatReaction): DocumentData {
    return reaction.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatReaction {
    return new ChatReaction(snapshot.id, snapshot.data())
  }
}

const reactionsCollection = (roomId: string, messageId: string) =>
  getFirestore().collection('chat_rooms').doc(roomId).collection('messages').doc(messageId).collection('reactions')

const reactionsQuery = (roomId: string, messageId: string) =>
  reactionsCollection(roomId, messageId).withConverter(new ChatReactionConverter())

export const getChatReactionRef = (roomId: string, messageId: string, userId: string) => {
  return reactionsCollection(roomId, messageId).doc(userId).withConverter(new ChatReactionConverter())
}

export const listChatReactions = async (roomId: string, messageId: string): Promise<ChatReaction[]> => {
  const snapshot = await reactionsQuery(roomId, messageId).get()
  return snapshot.docs.map((docSnapshot) => docSnapshot.data())
}

/** reactions サブコレクションを読み取り message.reaction_summary を Transaction で更新する */
export const syncChatMessageReactionSummary = async (roomId: string, messageId: string): Promise<void> => {
  const db = getFirestore()
  await db.runTransaction(async (transaction) => {
    const messageRef = getChatMessageRef(roomId, messageId)
    const messageSnap = await transaction.get(messageRef)
    if (!messageSnap.exists) {
      return
    }

    const reactionsSnap = await transaction.get(reactionsQuery(roomId, messageId))
    const reactions = reactionsSnap.docs.map((docSnapshot) => docSnapshot.data())
    const summary = normalizeReactionSummary(buildReactionSummary(reactions))

    if (summary == null) {
      transaction.update(messageRef, { reaction_summary: FieldValue.delete() })
      return
    }
    transaction.update(messageRef, { reaction_summary: summary })
  })
}
