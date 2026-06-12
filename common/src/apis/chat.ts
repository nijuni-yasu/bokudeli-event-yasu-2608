import { z } from 'zod'

export const RecallChatMessageRequestSchema = z.object({
  room_id: z.string().min(1),
  message_id: z.string().min(1),
})

export type RecallChatMessageRequest = z.infer<typeof RecallChatMessageRequestSchema>

export type RecallChatMessageResponse = {
  recalculated: boolean
}
