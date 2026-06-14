import { z } from 'zod'
import { CHAT_ROOM_TYPES, CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH, type ChatRoomType } from './ChatRoom.js'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

export const CHAT_UNREAD_COUNT_MAX = 99

const ChatMembershipDbSchema = z.object({
  room_id: z.string().nonempty(),
  room_type: z.enum(CHAT_ROOM_TYPES),
  is_active: z.boolean().default(true),
  unread_count: z.number().int().min(0).max(CHAT_UNREAD_COUNT_MAX).default(0),
  last_read_at: TimestampSchema.optional(),
  last_message_at: TimestampSchema.optional(),
  last_message_preview: z.string().max(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const ChatMembershipAppSchema = z.object({
  room_id: z.string().nonempty(),
  room_type: z.enum(CHAT_ROOM_TYPES),
  is_active: z.boolean().default(true),
  unread_count: z.number().int().min(0).max(CHAT_UNREAD_COUNT_MAX).default(0),
  last_read_at: EpochMillisSchema.optional(),
  last_message_at: EpochMillisSchema.optional(),
  last_message_preview: z.string().max(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).optional(),
})

const convertToDb = (membership: ChatMembership) => {
  const base = {
    ...membership,
    created_at: EpochMillisSchema.default(Date.now()).parse(membership.created_at),
    updated_at: Date.now(),
  }
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)) as z.infer<
    typeof ChatMembershipDbSchema
  >
}

export class ChatMembership {
  readonly id: string
  room_id!: string
  room_type!: ChatRoomType
  is_active: boolean = true
  unread_count: number = 0
  last_read_at?: number
  last_message_at?: number
  last_message_preview?: string
  created_at: number
  updated_at: number

  constructor(id: string, src: Partial<ChatMembership>) {
    Object.assign(this, ChatMembershipAppSchema.parse({ room_id: id, ...src }))
    this.id = id
    this.room_id = src.room_id ?? id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return ChatMembershipDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof ChatMembershipDbSchema> {
    return ChatMembershipDbSchema.parse(convertToDb(this))
  }
}
