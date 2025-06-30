import { z } from 'zod'

const COMMUNITY_MEMBER_ROLES = ['manager'] as const

export type CommunityMemberRolesType = (typeof COMMUNITY_MEMBER_ROLES)[number]

const CommunityMemberDbSchema = z.object({
  roles: z.array(z.enum(COMMUNITY_MEMBER_ROLES)).default([]),
})

// id 以外は デフォルト なので、 Schema は必要ない
export class CommunityMember {
  readonly id: string
  roles: CommunityMemberRolesType[] = []

  constructor(id: string, src: Partial<CommunityMember>) {
    Object.assign(this, src)
    this.id = id
  }

  isValidForDatabase(): boolean {
    return CommunityMemberDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof CommunityMemberDbSchema> {
    return CommunityMemberDbSchema.parse(this)
  }
}
