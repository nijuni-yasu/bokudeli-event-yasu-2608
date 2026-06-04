import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

export const CHAT_MESSAGE_TYPES = ['user', 'system'] as const
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]

export const CHAT_MESSAGE_BODY_MAX_LENGTH = 2000

export const CHAT_SYSTEM_EVENT_MEMBER_JOINED = 'member_joined'

const ChatUserMessageDbSchema = z.object({
  message_type: z.literal('user'),
  sender_user_id: z.string().nonempty(),
  body: z.string().min(1).max(CHAT_MESSAGE_BODY_MAX_LENGTH),
  created_at: TimestampSchema,
  processed: z.boolean().optional(),
})

const ChatSystemMessageDbSchema = z.object({
  message_type: z.literal('system'),
  system_event: z.string().nonempty(),
  system_params: z.record(z.string()),
  body: z.string().max(CHAT_MESSAGE_BODY_MAX_LENGTH).optional(),
  created_at: TimestampSchema,
  processed: z.boolean().optional(),
})

export const ChatMessageDbSchema = z.discriminatedUnion('message_type', [
  ChatUserMessageDbSchema,
  ChatSystemMessageDbSchema,
])

const ChatUserMessageAppSchema = z.object({
  message_type: z.literal('user'),
  sender_user_id: z.string().nonempty(),
  body: z.string().min(1).max(CHAT_MESSAGE_BODY_MAX_LENGTH),
})

const ChatSystemMessageAppSchema = z.object({
  message_type: z.literal('system'),
  system_event: z.string().nonempty(),
  system_params: z.record(z.string()),
  body: z.string().max(CHAT_MESSAGE_BODY_MAX_LENGTH).optional(),
})

export const ChatMessageAppSchema = z.discriminatedUnion('message_type', [
  ChatUserMessageAppSchema,
  ChatSystemMessageAppSchema,
])

export type ChatMessageApp = z.infer<typeof ChatMessageAppSchema>

const convertToDb = (message: ChatMessage) => {
  const base = {
    ...message,
    created_at: EpochMillisSchema.default(Date.now()).parse(message.created_at),
  }
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)) as z.infer<
    typeof ChatMessageDbSchema
  >
}

export class ChatMessage {
  readonly id: string
  message_type!: ChatMessageType
  sender_user_id?: string
  body?: string
  system_event?: string
  system_params?: Record<string, string>
  created_at: number

  constructor(id: string, src: Partial<ChatMessage>) {
    this.id = id
    if (src.message_type === 'system') {
      Object.assign(this, ChatSystemMessageAppSchema.parse(src))
    } else {
      Object.assign(this, ChatUserMessageAppSchema.parse({ message_type: 'user', ...src }))
    }
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
  }

  isValidForDatabase(): boolean {
    return ChatMessageDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof ChatMessageDbSchema> {
    return ChatMessageDbSchema.parse(convertToDb(this))
  }
}
