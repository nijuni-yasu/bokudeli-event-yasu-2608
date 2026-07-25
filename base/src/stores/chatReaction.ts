import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  ChatReaction,
  resolveChatReactionToggleAction,
  type ChatReactionEmoji,
  type ChatReactionSummary,
} from '@shokujii/common/schemas/ChatReaction.js'
import { applyOptimisticReactionSummary } from '@shokujii/common/utils/chatReactionSummary.js'
import { EpochMillisSchema } from '@shokujii/common/schemas/firebase/index.js'
import { db } from '@shokujii/base/firebase.js'
import { useChatStore } from '@shokujii/base/stores/chat.js'

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

const getChatReactionsCollectionRef = (roomId: string, messageId: string) => {
  return collection(db, 'chat_rooms', roomId, 'messages', messageId, 'reactions').withConverter(chatReactionConverter)
}

export const getChatReactionRef = (roomId: string, messageId: string, userId: string) => {
  return doc(getChatReactionsCollectionRef(roomId, messageId), userId)
}

export const listChatReactions = async (roomId: string, messageId: string): Promise<ChatReaction[]> => {
  const snapshot = await getDocs(getChatReactionsCollectionRef(roomId, messageId))
  return snapshot.docs.map((docSnapshot) => docSnapshot.data())
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

  await setDoc(ref, createReactionForUpdate(userId, emoji), { merge: true })
}

const applyOptimisticToggle = (
  chatStore: ReturnType<typeof useChatStore>,
  messageId: string,
  currentSummary: ChatReactionSummary | undefined,
  previousEmoji: ChatReactionEmoji | undefined,
  emoji: ChatReactionEmoji,
): ChatReactionEmoji | undefined => {
  const action = resolveChatReactionToggleAction(previousEmoji, emoji)
  const nextEmoji = action === 'remove' ? undefined : emoji
  const optimisticSummary = applyOptimisticReactionSummary(currentSummary, previousEmoji, nextEmoji)

  chatStore.patchMessageReactionSummary(messageId, optimisticSummary)
  chatStore.setMyReactionForMessage(messageId, nextEmoji)
  return nextEmoji
}

export const toggleReactionWithOptimistic = async (
  roomId: string,
  messageId: string,
  userId: string,
  emoji: ChatReactionEmoji,
  currentSummary: ChatReactionSummary | undefined,
): Promise<void> => {
  const chatStore = useChatStore()
  let previousEmoji = chatStore.getMyReactionForMessage(messageId)
  const cacheMiss = !chatStore.myReactionByMessageId.has(messageId)

  applyOptimisticToggle(chatStore, messageId, currentSummary, previousEmoji, emoji)

  if (cacheMiss) {
    try {
      const ref = getChatReactionRef(roomId, messageId, userId)
      const snapshot = await getDoc(ref)
      const resolvedPreviousEmoji = snapshot.exists() ? snapshot.data()?.emoji : undefined
      if (resolvedPreviousEmoji !== previousEmoji) {
        previousEmoji = resolvedPreviousEmoji
        applyOptimisticToggle(chatStore, messageId, currentSummary, previousEmoji, emoji)
      }
    } catch (error) {
      chatStore.patchMessageReactionSummary(messageId, currentSummary)
      chatStore.setMyReactionForMessage(messageId, previousEmoji)
      throw error
    }
  }

  try {
    await toggleReaction(roomId, messageId, userId, emoji)
    const ref = getChatReactionRef(roomId, messageId, userId)
    const snapshot = await getDoc(ref)
    chatStore.setMyReactionForMessage(messageId, snapshot.exists() ? snapshot.data()?.emoji : undefined)
  } catch (error) {
    chatStore.patchMessageReactionSummary(messageId, currentSummary)
    chatStore.setMyReactionForMessage(messageId, previousEmoji)
    throw error
  }
}
