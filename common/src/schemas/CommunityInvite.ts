/**
 * Invitation to join a community
 *
 * CommunityInvitation の方が正しそうだが、既に DB に Invite として登録してしまったのでこちらを維持する
 * TODO タイミングを見て修正も考える
 */

import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const COMMUNITY_MEMBER_ROLES = ['manager'] as const

export type CommunityMemberRolesType = (typeof COMMUNITY_MEMBER_ROLES)[number]

const CommunityInviteDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  has_token_been_redeemed: z.boolean(),
  inviter_id: z.string().nonempty(),
})

const CommunityInviteAppSchema = z.object({
  created_at: EpochMillisSchema,
  updated_at: EpochMillisSchema,
  has_token_been_redeemed: z.boolean(),
  inviter_id: z.string().nonempty(),
})

export class CommunityInvite {
  readonly id: string
  created_at!: number
  updated_at!: number
  has_token_been_redeemed!: boolean
  inviter_id!: string

  constructor(id: string, src: Partial<CommunityInvite>) {
    Object.assign(this, CommunityInviteAppSchema.parse(src))
    this.id = id
  }

  isValidForDatabase(): boolean {
    return CommunityInviteDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof CommunityInviteDbSchema> {
    return CommunityInviteDbSchema.parse(this)
  }
}
