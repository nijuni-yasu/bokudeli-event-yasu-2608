import { DocumentReference, getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './logger.js'
import { getCommunity, communityMemberConverter } from '../stores/community.js'
import { getUserRef } from '../stores/user.js'

const logger = createModuleLogger('recalcCommunityMembers')

export type RecalcCommunityMembersResult = {
  updated: boolean
  memberCount: number
  addedManagerIds: string[]
  removedManagerIds: string[]
  communityAccount: string
  communityName: string
}

const refsToSortedIds = (refs: DocumentReference[]): string[] => refs.map((ref) => ref.id).sort()

const arraysEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index])

/**
 * `communities/{communityId}/members` サブコレクションを集計し、
 * 親 `communities` の `community_num_members` / `members` / `managers` を更新する。
 * legacy `on_write_community_members` の集計処理を default へ移行したもの。
 */
export async function recalcCommunityMembers(communityId: string): Promise<RecalcCommunityMembersResult> {
  const db = getFirestore()

  return db.runTransaction(async (transaction) => {
    const community = await getCommunity(communityId, transaction)
    if (community == null) {
      logger.warn('Community not found', { communityId })
      return {
        updated: false,
        memberCount: 0,
        addedManagerIds: [],
        removedManagerIds: [],
        communityAccount: '',
        communityName: '',
      }
    }

    const oldManagerIds = refsToSortedIds(community.managers ?? [])
    const oldMemberIds = refsToSortedIds(community.members ?? [])

    const communityRef = db.collection('communities').doc(communityId)
    const membersRef = communityRef.collection('members').withConverter(communityMemberConverter)
    const membersSnapshot = await transaction.get(membersRef)

    const members: DocumentReference[] = []
    const managers: DocumentReference[] = []

    for (const memberDoc of membersSnapshot.docs) {
      const userRef = getUserRef(memberDoc.id)
      members.push(userRef)
      const roles = memberDoc.data().roles ?? []
      if (roles.includes('manager')) {
        managers.push(userRef)
      }
    }

    const newMemberIds = refsToSortedIds(members)
    const newManagerIds = refsToSortedIds(managers)

    const communitySnapshot = await transaction.get(communityRef)
    const currentNumMembers =
      typeof communitySnapshot.get('community_num_members') === 'number'
        ? (communitySnapshot.get('community_num_members') as number)
        : oldMemberIds.length

    const same =
      currentNumMembers === members.length &&
      arraysEqual(oldMemberIds, newMemberIds) &&
      arraysEqual(oldManagerIds, newManagerIds)

    if (!same) {
      transaction.update(communityRef, {
        community_num_members: members.length,
        members,
        managers,
      })
    }

    const addedManagerIds = newManagerIds.filter((id) => !oldManagerIds.includes(id))
    const removedManagerIds = oldManagerIds.filter((id) => !newManagerIds.includes(id))

    return {
      updated: !same,
      memberCount: members.length,
      addedManagerIds,
      removedManagerIds,
      communityAccount: community.community_account,
      communityName: community.community_name,
    }
  })
}
