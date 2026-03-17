import { z } from 'zod'

export const sendTestLetterRequestSchema = z.object({
  communityId: z.string().nonempty(),
  letterId: z.string().nonempty(),
})

export const sendIndividualLetterRequestSchema = z.object({
  communityId: z.string().nonempty(),
  letterId: z.string().nonempty(),
})

export type SendIndividualLetterRequest = z.infer<typeof sendIndividualLetterRequestSchema>
