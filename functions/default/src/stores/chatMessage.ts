import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { ChatMessage } from '@shokujii/common/schemas/ChatMessage.js'

class ChatMessageConverter implements FirestoreDataConverter<ChatMessage> {
  toFirestore(message: ChatMessage): DocumentData {
    return message.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatMessage {
    return new ChatMessage(snapshot.id, snapshot.data())
  }
}

const messagesCollection = (roomId: string) =>
  getFirestore().collection('chat_rooms').doc(roomId).collection('messages')

export const getChatMessageRef = (roomId: string, messageId: string) => {
  return messagesCollection(roomId).doc(messageId).withConverter(new ChatMessageConverter())
}

export const getChatMessage = async (
  roomId: string,
  messageId: string,
  transaction?: Transaction,
): Promise<ChatMessage | undefined> => {
  const ref = getChatMessageRef(roomId, messageId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveChatMessage = async (
  roomId: string,
  message: ChatMessage,
  transaction?: Transaction,
): Promise<void> => {
  const ref = getChatMessageRef(roomId, message.id)
  if (transaction === undefined) {
    await ref.set(message)
  } else {
    transaction.set(ref, message)
  }
}

export const addUserChatMessage = (params: {
  roomId: string
  messageId: string
  senderUserId: string
  body: string
  createdAt?: number
}): ChatMessage => {
  return new ChatMessage(params.messageId, {
    message_type: 'user',
    sender_user_id: params.senderUserId,
    body: params.body,
    created_at: params.createdAt ?? Date.now(),
  })
}

export const isMessageProcessed = async (
  roomId: string,
  messageId: string,
  transaction: Transaction,
): Promise<boolean> => {
  const ref = getChatMessageRef(roomId, messageId)
  const snapshot = await transaction.get(ref)
  return snapshot.exists && snapshot.get('processed') === true
}

/** 未処理なら processed を原子的に立てる。成功時のみ true（副作用は呼び出し側で実行） */
export const claimMessageProcessed = async (
  roomId: string,
  messageId: string,
  transaction: Transaction,
): Promise<boolean> => {
  const ref = getChatMessageRef(roomId, messageId)
  const snapshot = await transaction.get(ref)
  if (!snapshot.exists || snapshot.get('processed') === true) {
    return false
  }
  transaction.update(ref, { processed: true })
  return true
}

export const addSystemChatMessage = (params: {
  roomId: string
  messageId: string
  systemEvent: string
  systemParams: Record<string, string>
  createdAt?: number
}): ChatMessage => {
  return new ChatMessage(params.messageId, {
    message_type: 'system',
    system_event: params.systemEvent,
    system_params: params.systemParams,
    created_at: params.createdAt ?? Date.now(),
  })
}
