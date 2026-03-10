import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const COMMUNITY_MEMBER_ROLES = ['manager'] as const

export type CommunityMemberRolesType = (typeof COMMUNITY_MEMBER_ROLES)[number]

const CommunityMemberDbSchema = z.object({
  roles: z.array(z.enum(COMMUNITY_MEMBER_ROLES)).default([]),
  updated_at: TimestampSchema,
})

const convertToDb = (member: CommunityMember) => {
  return {
    ...member,
    updated_at: Date.now(),
  }
}

export class CommunityMember {
  readonly id: string
  roles: CommunityMemberRolesType[] = []
  updated_at: number

  constructor(id: string, src: Partial<CommunityMember>) {
    Object.assign(this, src)
    this.id = id
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return CommunityMemberDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof CommunityMemberDbSchema> {
    return CommunityMemberDbSchema.parse(convertToDb(this))
  }
}
