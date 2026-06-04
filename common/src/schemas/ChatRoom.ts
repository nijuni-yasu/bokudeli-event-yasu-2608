import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

export const CHAT_ROOM_TYPES = ['direct', 'event', 'community'] as const
export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number]

export const CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH = 100

export function buildEventChatRoomId(communityId: string, eventId: string): string {
  return `event_${communityId}_${eventId}`
}

export function buildCommunityChatRoomId(communityId: string): string {
  return `community_${communityId}`
}

export function buildDirectChatRoomId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_')
}

const EVENT_ROOM_ID_PREFIX = 'event_'
const COMMUNITY_ROOM_ID_PREFIX = 'community_'

export function parseEventChatRoomId(roomId: string): { communityId: string; eventId: string } | null {
  if (!roomId.startsWith(EVENT_ROOM_ID_PREFIX)) {
    return null
  }
  const rest = roomId.slice(EVENT_ROOM_ID_PREFIX.length)
  const separatorIndex = rest.indexOf('_')
  if (separatorIndex <= 0 || separatorIndex >= rest.length - 1) {
    return null
  }
  const communityId = rest.slice(0, separatorIndex)
  const eventId = rest.slice(separatorIndex + 1)
  if (communityId === '' || eventId === '') {
    return null
  }
  return { communityId, eventId }
}

export function parseCommunityChatRoomId(roomId: string): { communityId: string } | null {
  if (!roomId.startsWith(COMMUNITY_ROOM_ID_PREFIX)) {
    return null
  }
  const communityId = roomId.slice(COMMUNITY_ROOM_ID_PREFIX.length)
  if (communityId === '') {
    return null
  }
  return { communityId }
}

export function parseDirectChatRoomId(roomId: string, currentUserId: string): string | null {
  const parts = roomId.split('_')
  if (parts.length !== 2) {
    return null
  }
  const [uidA, uidB] = parts
  if (uidA === '' || uidB === '') {
    return null
  }
  if (uidA === currentUserId) {
    return uidB
  }
  if (uidB === currentUserId) {
    return uidA
  }
  return null
}

const ChatRoomDbSchema = z.object({
  room_type: z.enum(CHAT_ROOM_TYPES),
  community_id: NonEmptyStringSchema.optional(),
  event_id: NonEmptyStringSchema.optional(),
  member_user_ids: z.array(z.string().nonempty()).default([]),
  direct_user_ids: z.array(z.string().nonempty()).length(2).optional(),
  title: NonEmptyStringSchema.optional(),
  is_active: z.boolean().default(true),
  last_message_at: TimestampSchema.optional(),
  last_message_preview: z.string().max(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const ChatRoomAppSchema = z.object({
  room_type: z.enum(CHAT_ROOM_TYPES),
  community_id: z.string().optional(),
  event_id: z.string().optional(),
  member_user_ids: z.array(z.string()).default([]),
  direct_user_ids: z.tuple([z.string(), z.string()]).optional(),
  title: z.string().optional(),
  is_active: z.boolean().default(true),
  last_message_at: EpochMillisSchema.optional(),
  last_message_preview: z.string().max(CHAT_LAST_MESSAGE_PREVIEW_MAX_LENGTH).optional(),
})

const convertToDb = (room: ChatRoom) => {
  return {
    ...room,
    created_at: EpochMillisSchema.default(Date.now()).parse(room.created_at),
    updated_at: Date.now(),
  }
}

export class ChatRoom {
  readonly id: string
  room_type!: ChatRoomType
  community_id?: string
  event_id?: string
  member_user_ids: string[] = []
  direct_user_ids?: [string, string]
  title?: string
  is_active: boolean = true
  last_message_at?: number
  last_message_preview?: string
  created_at: number
  updated_at: number

  constructor(id: string, src: Partial<ChatRoom>) {
    Object.assign(this, ChatRoomAppSchema.parse(src))
    this.id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return ChatRoomDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof ChatRoomDbSchema> {
    return ChatRoomDbSchema.parse(convertToDb(this))
  }
}
