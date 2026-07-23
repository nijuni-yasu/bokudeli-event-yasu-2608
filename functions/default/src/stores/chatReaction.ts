import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { ChatReaction } from '@shokujii/common/schemas/ChatReaction.js'

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

export const getChatReactionRef = (roomId: string, messageId: string, userId: string) => {
  return reactionsCollection(roomId, messageId).doc(userId).withConverter(new ChatReactionConverter())
}

export const listChatReactions = async (roomId: string, messageId: string): Promise<ChatReaction[]> => {
  const snapshot = await reactionsCollection(roomId, messageId).withConverter(new ChatReactionConverter()).get()
  return snapshot.docs.map((docSnapshot) => docSnapshot.data())
}
