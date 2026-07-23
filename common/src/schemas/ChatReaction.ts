import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

/** 許可リアクション emoji（UTF-16 サロゲートペア含む 😭 は Rules / Zod / テストで一致させる） */
export const CHAT_REACTION_EMOJIS = ['👍', '❤️', '😆', '😭', '🎉', '🙏'] as const

export type ChatReactionEmoji = (typeof CHAT_REACTION_EMOJIS)[number]

export const ChatReactionEmojiSchema = z.enum(CHAT_REACTION_EMOJIS)

export const ChatReactionSummarySchema = z.record(z.string(), z.number().int().positive())

export type ChatReactionSummary = z.infer<typeof ChatReactionSummarySchema>

const ChatReactionDbSchema = z.object({
  emoji: ChatReactionEmojiSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const ChatReactionAppSchema = z.object({
  emoji: ChatReactionEmojiSchema,
})

const convertToDb = (reaction: ChatReaction) => {
  const base = {
    ...reaction,
    created_at: EpochMillisSchema.default(Date.now()).parse(reaction.created_at),
    updated_at: Date.now(),
  }
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)) as z.infer<
    typeof ChatReactionDbSchema
  >
}

export class ChatReaction {
  readonly id: string
  emoji!: ChatReactionEmoji
  created_at: number
  updated_at: number

  constructor(id: string, src: Partial<ChatReaction>) {
    Object.assign(this, ChatReactionAppSchema.parse({ ...src }))
    this.id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return ChatReactionDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof ChatReactionDbSchema> {
    return ChatReactionDbSchema.parse(convertToDb(this))
  }
}

export type ChatReactionToggleAction = 'add' | 'remove' | 'update'

/** 同一 emoji → 削除、別 emoji → 上書き、未設定 → 追加 */
export const resolveChatReactionToggleAction = (
  currentEmoji: ChatReactionEmoji | undefined,
  clickedEmoji: ChatReactionEmoji,
): ChatReactionToggleAction => {
  if (currentEmoji == null) {
    return 'add'
  }
  if (currentEmoji === clickedEmoji) {
    return 'remove'
  }
  return 'update'
}
