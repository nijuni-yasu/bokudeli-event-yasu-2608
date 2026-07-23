import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  ChatReaction,
  resolveChatReactionToggleAction,
  type ChatReactionEmoji,
} from '@shokujii/common/schemas/ChatReaction.js'
import { EpochMillisSchema } from '@shokujii/common/schemas/firebase/index.js'
import { db } from '@shokujii/base/firebase.js'

const parseEpochMillisOrDefault = (value: unknown, defaultValue: number): number => {
  const result = EpochMillisSchema.safeParse(value)
  return result.success ? result.data : defaultValue
}

const reactionFromFirestore = (snapshot: QueryDocumentSnapshot): ChatReaction => {
  const raw = snapshot.data()
  const now = Date.now()
  return new ChatReaction(snapshot.id, {
    ...raw,
    created_at: parseEpochMillisOrDefault(raw.created_at, now),
    updated_at: parseEpochMillisOrDefault(raw.updated_at, now),
  })
}

/** toggleReaction 用: Rules の request.time 一致のため serverTimestamp() で書き込む */
type ChatReactionWrite = ChatReaction & { writeMode?: 'create' | 'update' }

const chatReactionConverter: FirestoreDataConverter<ChatReactionWrite> = {
  toFirestore(reaction: ChatReactionWrite): DocumentData {
    if (reaction.writeMode === 'create') {
      return {
        emoji: reaction.emoji,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }
    }
    if (reaction.writeMode === 'update') {
      return {
        emoji: reaction.emoji,
        updated_at: serverTimestamp(),
      }
    }
    return reaction.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ChatReaction {
    return reactionFromFirestore(snapshot)
  },
}

const createReactionForSend = (userId: string, emoji: ChatReactionEmoji): ChatReactionWrite => {
  return Object.assign(new ChatReaction(userId, { emoji }), { writeMode: 'create' as const })
}

const createReactionForUpdate = (userId: string, emoji: ChatReactionEmoji): ChatReactionWrite => {
  return Object.assign(new ChatReaction(userId, { emoji }), { writeMode: 'update' as const })
}

export const getChatReactionRef = (roomId: string, messageId: string, userId: string) => {
  return doc(db, 'chat_rooms', roomId, 'messages', messageId, 'reactions', userId).withConverter(chatReactionConverter)
}

export const toggleReaction = async (
  roomId: string,
  messageId: string,
  userId: string,
  emoji: ChatReactionEmoji,
): Promise<void> => {
  const ref = getChatReactionRef(roomId, messageId, userId)
  const snapshot = await getDoc(ref)
  const currentEmoji = snapshot.exists() ? snapshot.data()?.emoji : undefined
  const action = resolveChatReactionToggleAction(currentEmoji, emoji)

  if (action === 'remove') {
    await deleteDoc(ref)
    return
  }

  if (action === 'add') {
    await setDoc(ref, createReactionForSend(userId, emoji))
    return
  }

  await updateDoc(ref, createReactionForUpdate(userId, emoji))
}
