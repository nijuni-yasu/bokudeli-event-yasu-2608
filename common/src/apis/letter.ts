import { z } from 'zod'

export const sendTestLetterRequestSchema = z.object({
  communityId: z.string().nonempty(),
  letterId: z.string().nonempty(),
})
