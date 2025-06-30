/**
 * Invitation to join a community
 *
 * CommunityInvitation の方が正しそうだが、既に DB に Invite として登録してしまったのでこちらを維持する
 * TODO タイミングを見て修正も考える
 */

import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const CommunityInviteDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  has_token_been_redeemed: z.boolean(),
  inviter_id: z.string().nonempty(),
})

const CommunityInviteAppSchema = z.object({
  has_token_been_redeemed: z.boolean(),
  inviter_id: z.string().nonempty(),
})

export class CommunityInvite {
  // Mandatory
  readonly id: string
  created_at: number
  updated_at: number
  has_token_been_redeemed!: boolean
  inviter_id!: string

  constructor(id: string, src: Partial<CommunityInvite>) {
    Object.assign(this, CommunityInviteAppSchema.parse(src))
    this.id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  private getDb() {
    return {
      ...this,
      created_at: EpochMillisSchema.default(Date.now()).parse(this.created_at),
      updated_at: Date.now(),
    }
  }

  isValidForDatabase(): boolean {
    return CommunityInviteDbSchema.safeParse(this.getDb()).success
  }

  toFirestore(): z.infer<typeof CommunityInviteDbSchema> {
    return CommunityInviteDbSchema.parse(this.getDb())
  }
}
