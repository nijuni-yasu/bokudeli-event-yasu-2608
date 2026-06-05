import { z } from 'zod'
import { type DocumentReference } from './firebase/index.js'

const COMMUNITY_BOT_TYPES = ['slack'] as const
export type CommunityBotType = (typeof COMMUNITY_BOT_TYPES)[number]

const isDocumentReference = (value: unknown): value is typeof DocumentReference =>
  value != null && typeof value === 'object' && 'path' in value && typeof (value as { path: unknown }).path === 'string'

const CommunityBotDbSchema = z.object({
  type: z.enum(COMMUNITY_BOT_TYPES),
  reference: z.custom<typeof DocumentReference>(isDocumentReference),
})

export class CommunityBot {
  readonly id: string
  type!: CommunityBotType
  reference!: typeof DocumentReference

  constructor(id: string, src: Partial<CommunityBot>) {
    Object.assign(this, src)
    this.id = id
  }

  isValidForDatabase(): boolean {
    return CommunityBotDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof CommunityBotDbSchema> {
    return CommunityBotDbSchema.parse(this)
  }
}
