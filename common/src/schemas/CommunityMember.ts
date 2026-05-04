import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const COMMUNITY_MEMBER_ROLES = ['manager'] as const

export type CommunityMemberRolesType = (typeof COMMUNITY_MEMBER_ROLES)[number]

const ALLOWED_ROLE_SET = new Set<string>(COMMUNITY_MEMBER_ROLES)

/**
 * Firestore のレガシー配列を正規化する。空・空白のみ・非 string は除き、trim 後の文字列のうち
 * 許可リストに含まれるものだけ残す（未知のロールは黙って削除）。Zod エラーは起きにくいが、
 * read→set 経路では未知ロールのサイレント欠損が起こりうる。
 */
export function normalizeCommunityMemberRoles(roles: unknown): CommunityMemberRolesType[] {
  if (!Array.isArray(roles)) {
    return []
  }
  const cleaned: string[] = []
  for (const item of roles) {
    if (typeof item !== 'string') {
      continue
    }
    const t = item.trim()
    if (t === '') {
      continue
    }
    cleaned.push(t)
  }
  return cleaned.filter((r): r is CommunityMemberRolesType => ALLOWED_ROLE_SET.has(r))
}

const CommunityMemberDbSchema = z.object({
  roles: z.array(z.enum(COMMUNITY_MEMBER_ROLES)).default([]),
  updated_at: TimestampSchema,
})

const convertToDb = (member: CommunityMember) => {
  return {
    ...member,
    roles: normalizeCommunityMemberRoles(member.roles),
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
    this.roles = normalizeCommunityMemberRoles(this.roles)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return CommunityMemberDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof CommunityMemberDbSchema> {
    return CommunityMemberDbSchema.parse(convertToDb(this))
  }
}
