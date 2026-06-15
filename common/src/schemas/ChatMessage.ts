import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

export const CHAT_MESSAGE_TYPES = ['user', 'system'] as const
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]

export const CHAT_MESSAGE_BODY_MAX_LENGTH = 2000

export const CHAT_ATTACHMENT_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const

export type ChatAttachmentImageMimeType = (typeof CHAT_ATTACHMENT_IMAGE_MIME_TYPES)[number]

export const CHAT_ATTACHMENT_MAX_BYTE_SIZE = 10 * 1024 * 1024

export const CHAT_ATTACHMENT_MAX_COUNT = 1

export const CHAT_SYSTEM_EVENT_MEMBER_JOINED = 'member_joined'

export const ChatAttachmentSchema = z.object({
  storage_path: z.string().nonempty(),
  content_type: z.enum(CHAT_ATTACHMENT_IMAGE_MIME_TYPES),
  file_name: z.string().nonempty().max(255),
  byte_size: z.number().int().positive().max(CHAT_ATTACHMENT_MAX_BYTE_SIZE),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export type ChatAttachment = z.infer<typeof ChatAttachmentSchema>

const hasAttachments = (attachments: ChatAttachment[] | undefined): boolean => {
  return attachments != null && attachments.length > 0
}

const requireBodyUnlessDeleted = (
  data: { message_type?: string; body?: string; deleted_at?: unknown; attachments?: ChatAttachment[] },
  ctx: z.RefinementCtx,
): void => {
  if (data.message_type !== 'user') {
    return
  }
  if (data.deleted_at != null) {
    return
  }
  const hasBody = data.body != null && data.body.length > 0
  if (!hasBody && !hasAttachments(data.attachments)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'body or attachments is required when message is not deleted',
      path: ['body'],
    })
  }
}

const ChatUserMessageDbSchema = z.object({
  message_type: z.literal('user'),
  sender_user_id: z.string().nonempty(),
  body: z.string().min(1).max(CHAT_MESSAGE_BODY_MAX_LENGTH).optional(),
  attachments: z.array(ChatAttachmentSchema).min(1).max(CHAT_ATTACHMENT_MAX_COUNT).optional(),
  created_at: TimestampSchema,
  deleted_at: TimestampSchema.optional(),
  deleted_by_user_id: z.string().nonempty().optional(),
  deleted_display_name: z.string().nonempty().optional(),
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

export const ChatMessageDbSchema = z
  .discriminatedUnion('message_type', [ChatUserMessageDbSchema, ChatSystemMessageDbSchema])
  .superRefine(requireBodyUnlessDeleted)

const ChatUserMessageAppSchema = z.object({
  message_type: z.literal('user'),
  sender_user_id: z.string().nonempty(),
  body: z.string().min(1).max(CHAT_MESSAGE_BODY_MAX_LENGTH).optional(),
  attachments: z.array(ChatAttachmentSchema).min(1).max(CHAT_ATTACHMENT_MAX_COUNT).optional(),
  deleted_at: EpochMillisSchema.optional(),
  deleted_by_user_id: z.string().nonempty().optional(),
  deleted_display_name: z.string().nonempty().optional(),
})

const ChatSystemMessageAppSchema = z.object({
  message_type: z.literal('system'),
  system_event: z.string().nonempty(),
  system_params: z.record(z.string()),
  body: z.string().max(CHAT_MESSAGE_BODY_MAX_LENGTH).optional(),
})

export const ChatMessageAppSchema = z
  .discriminatedUnion('message_type', [ChatUserMessageAppSchema, ChatSystemMessageAppSchema])
  .superRefine(requireBodyUnlessDeleted)

export type ChatMessageApp = z.infer<typeof ChatMessageAppSchema>

const convertToDb = (message: ChatMessage) => {
  const base = {
    ...message,
    created_at: EpochMillisSchema.default(Date.now()).parse(message.created_at),
    deleted_at: message.deleted_at == null ? undefined : EpochMillisSchema.parse(message.deleted_at),
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
  deleted_at?: number
  deleted_by_user_id?: string
  deleted_display_name?: string
  attachments?: ChatAttachment[]

  constructor(id: string, src: Partial<ChatMessage>) {
    this.id = id
    const parsed = ChatMessageAppSchema.parse({
      message_type: src.message_type ?? 'user',
      ...src,
    })
    Object.assign(this, parsed)
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    if (src.deleted_at != null) {
      this.deleted_at = EpochMillisSchema.parse(src.deleted_at)
    }
  }

  isValidForDatabase(): boolean {
    return ChatMessageDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof ChatMessageDbSchema> {
    return ChatMessageDbSchema.parse(convertToDb(this))
  }
}
