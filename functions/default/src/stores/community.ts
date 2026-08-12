import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/https'
import { Community } from '@shokujii/common/schemas/Community.js'
import { CommunityMember, CommunityMemberRolesType } from '@shokujii/common/schemas/CommunityMember.js'
import { CommunityInvite } from '@shokujii/common/schemas/CommunityInvite.js'
import { getCommunityInvitationUrl } from '../utils/urls.js'
import { getUserRef } from './user.js'

const EXPIRED_TIME = 7 * 1000 * 60 * 60 * 24 // 7 days

export const communityMemberConverter: FirestoreDataConverter<CommunityMember> = {
  toFirestore(member: CommunityMember): DocumentData {
    return member.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CommunityMember {
    return new CommunityMember(snapshot.id, snapshot.data())
  },
}

const communityConverter: FirestoreDataConverter<ShokujiiCommunity> = {
  toFirestore(community: ShokujiiCommunity): DocumentData {
    return community.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiCommunity {
    return new ShokujiiCommunity(snapshot.id, snapshot.data())
  },
}

const communityInviteConverter: FirestoreDataConverter<CommunityInvite> = {
  toFirestore(invite: CommunityInvite): DocumentData {
    return invite.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CommunityInvite {
    return new CommunityInvite(snapshot.id, snapshot.data())
  },
}

export class ShokujiiCommunity extends Community {
  private _members: CommunityMember[] | null = null
  async getMembers(): Promise<CommunityMember[]> {
    if (this._members === null) {
      const db = getFirestore()
      const snapshot = await db
        .collection('communities')
        .doc(this.id)
        .collection('members')
        .withConverter(communityMemberConverter)
        .get()
      this._members = snapshot.docs.map((doc) => doc.data())
    }
    return this._members
  }

  async hasRole(memberId: string, role: CommunityMemberRolesType): Promise<boolean> {
    const members = await this.getMembers()
    return members.some((member) => member.id === memberId && member.roles.includes(role))
  }

  async getMembersByRole(role: CommunityMemberRolesType): Promise<CommunityMember[]> {
    const members = await this.getMembers()
    return members.filter((member) => member.roles.includes(role))
  }

  async addMember(userId: string, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const memberRef = db
      .collection('communities')
      .doc(this.id)
      .collection('members')
      .doc(userId)
      .withConverter(communityMemberConverter)

    // 既存メンバーの roles を引き継ぎつつ updated_at を更新する。新規の場合は roles: [] で作成する
    const snapshot = await (transaction === undefined ? memberRef.get() : transaction.get(memberRef))
    const data = snapshot.data() ?? new CommunityMember(userId, {})

    if (transaction === undefined) {
      await memberRef.set(data)
    } else {
      transaction.set(memberRef, data)
    }
  }

  async createManagerInviteToken(uid: string): Promise<string> {
    const db = getFirestore()
    const invitesCollectionRef = db
      .collection('communities')
      .doc(this.id)
      .collection('invites')
      .withConverter(communityInviteConverter)
    const inviteRef = invitesCollectionRef.doc()
    const now = Timestamp.now().toMillis()
    await inviteRef.set(
      new CommunityInvite(inviteRef.id, {
        has_token_been_redeemed: false,
        inviter_id: uid,
        created_at: now,
        updated_at: now,
      }),
    )
    return inviteRef.id
  }

  async generateInvitationUrlForManager(uid: string): Promise<string> {
    const tokenId = await this.createManagerInviteToken(uid)
    return getCommunityInvitationUrl(this.community_account, tokenId)
  }

  async inviteAsManager(uid: string, token: string): Promise<void> {
    const db = getFirestore()
    const communityRef = db.collection('communities').doc(this.id).withConverter(communityConverter)
    const memberRef = communityRef.collection('members').doc(uid).withConverter(communityMemberConverter)
    const inviteRef = communityRef.collection('invites').doc(token).withConverter(communityInviteConverter)
    const inviteDoc = await inviteRef.get()
    if (!inviteDoc.exists) {
      throw new HttpsError('not-found', 'The invitation does not exist.')
    }
    const created_at = inviteDoc.get('created_at')
    const now = Timestamp.now()
    if (created_at.toMillis() < now.toMillis() - EXPIRED_TIME) {
      throw new HttpsError('invalid-argument', 'The token is expired.')
    }
    if (inviteDoc.get('has_token_been_redeemed') === true) {
      throw new HttpsError('invalid-argument', 'The token has been redeemed.')
    }
    // invite と set を batch で実行する
    const batch = db.batch().update(inviteRef, {
      has_token_been_redeemed: true,
      updated_at: now,
    })
    const memberDoc = await memberRef.get()
    if (memberDoc.exists) {
      // 既に存在する場合は roles に 'manager' を追加
      const roles = new Set(memberDoc.get('roles') ?? []) as Set<CommunityMemberRolesType>
      roles.add('manager')
      batch.update(memberRef, {
        roles: Array.from(roles),
      })
    } else {
      const m = new CommunityMember(uid, {
        roles: ['manager'],
      })
      batch.set(memberRef, m)
    }
    await batch.commit()
  }
}

export const getCommunity = async (
  communityId: string,
  transaction?: Transaction,
): Promise<ShokujiiCommunity | undefined> => {
  const db = getFirestore()
  const communityRef = db.collection('communities').doc(communityId).withConverter(communityConverter)

  const snapshot = await (transaction === undefined ? communityRef.get() : transaction.get(communityRef))
  return snapshot.exists ? (snapshot.data() ?? undefined) : undefined
}

/**
 * `communities/{communityId}` を一括取得する。
 * 大量参照時は Firestore の getAll の上限を考慮して 100 件単位でチャンクする。
 */
export const getCommunitiesByIds = async (communityIds: readonly string[]): Promise<Map<string, ShokujiiCommunity>> => {
  const result = new Map<string, ShokujiiCommunity>()
  const uniqueIds = Array.from(new Set(communityIds.filter((id) => id !== '')))
  if (uniqueIds.length === 0) {
    return result
  }
  const db = getFirestore()
  const CHUNK_SIZE = 100
  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE)
    const docRefs = chunk.map((id) => db.collection('communities').doc(id).withConverter(communityConverter))
    const snapshots = await db.getAll(...docRefs)
    snapshots.forEach((snapshot) => {
      if (!snapshot.exists) {
        return
      }
      const data = snapshot.data() as ShokujiiCommunity | undefined
      if (data == null) {
        return
      }
      result.set(data.id, data)
    })
  }
  return result
}

/**
 * PF 名前空間（`enterprise_id == null`）のコミュニティを community_account で取得する。
 */
export const getPfCommunityByAccount = async (
  communityAccount: string,
  transaction?: Transaction,
): Promise<ShokujiiCommunity | undefined> => {
  const db = getFirestore()
  const communityQuery = db
    .collection('communities')
    .where('enterprise_id', '==', null)
    .where('community_account', '==', communityAccount)
    .limit(1)
    .withConverter(communityConverter)

  const snapshot = await (transaction === undefined ? communityQuery.get() : transaction.get(communityQuery))
  return snapshot.empty ? undefined : snapshot.docs[0].data()
}

/** @deprecated 名前は PF 専用。新規コードは getPfCommunityByAccount を使う */
export const getCommunityByAccount = getPfCommunityByAccount

export const getCommunityByAccountInEnterprise = async (
  enterpriseId: string,
  communityAccount: string,
  transaction?: Transaction,
): Promise<ShokujiiCommunity | undefined> => {
  const db = getFirestore()
  const communityQuery = db
    .collection('communities')
    .where('enterprise_id', '==', enterpriseId)
    .where('community_account', '==', communityAccount)
    .limit(1)
    .withConverter(communityConverter)

  const snapshot = await (transaction === undefined ? communityQuery.get() : transaction.get(communityQuery))
  return snapshot.empty ? undefined : snapshot.docs[0].data()
}

/**
 * ユーザーが唯一の管理者であるコミュニティが存在するかチェックする。
 * トランザクション内で呼び出し、取得〜削除の整合性を担保する。
 *
 * @param userId チェック対象のユーザーID
 * @param transaction Firestore トランザクション（必須）
 * @returns 唯一の管理者であるコミュニティが1件以上あれば true
 */
export const hasSoleManagerCommunity = async (userId: string, transaction: Transaction): Promise<boolean> => {
  const db = getFirestore()
  const userRef = getUserRef(userId)
  const communitiesRef = db
    .collection('communities')
    .where('managers', 'array-contains', userRef)
    .withConverter(communityConverter)
  const snapshot = await transaction.get(communitiesRef)
  return snapshot.docs.some((d) => {
    const managers = d.data().managers ?? []
    return managers.length === 1
  })
}

/**
 * ユーザーがメンバーであるコミュニティのドキュメント一覧を取得する。
 * トランザクション内で呼び出し、取得〜削除の整合性を担保する。
 *
 * @param userId チェック対象のユーザーID
 * @param transaction Firestore トランザクション（必須）
 * @returns 該当コミュニティの QueryDocumentSnapshot 配列
 */
export const getCommunitiesWhereUserIsMember = async (
  userId: string,
  transaction: Transaction,
): Promise<QueryDocumentSnapshot<ShokujiiCommunity>[]> => {
  const db = getFirestore()
  const userRef = getUserRef(userId)
  const communitiesRef = db
    .collection('communities')
    .where('members', 'array-contains', userRef)
    .withConverter(communityConverter)
  const snapshot = await transaction.get(communitiesRef)
  return snapshot.docs
}

/**
 * コミュニティの members サブコレクションからユーザーを削除する。
 * トランザクション内で呼び出すこと。
 *
 * @param communityId コミュニティID
 * @param userId 削除するユーザーID
 * @param transaction Firestore トランザクション（必須）
 */
export const removeMemberFromCommunity = async (
  communityId: string,
  userId: string,
  transaction: Transaction,
): Promise<void> => {
  const db = getFirestore()
  const communityRef = db.collection('communities').doc(communityId)
  const memberRef = communityRef.collection('members').doc(userId).withConverter(communityMemberConverter)
  transaction.delete(memberRef)
}

/**
 * 参加コミュニティ数（親 `communities.members` 配列に userRef が含まれる件数）。
 * members サブコレは書き込み正本。集計 read は UI（UserProfilePage）と同じ親配列を使う（RC-55）。
 * collection group + documentId は Admin SDK エラーおよび events/members 混入のため非採用。
 */
export const countJoinedCommunitiesForUser = async (userId: string, enterpriseId?: string): Promise<number> => {
  if (userId === '') {
    return 0
  }
  const db = getFirestore()
  const userRef = getUserRef(userId)
  let q = db.collection('communities').where('members', 'array-contains', userRef)
  if (enterpriseId != null && enterpriseId !== '') {
    q = q.where('enterprise_id', '==', enterpriseId)
  }
  const snapshot = await q.count().get()
  return snapshot.data().count
}

/**
 * マイページプロフィール用のコミュニティプレビュー（§4.2.0）。
 * 限定公開も含め参加・運営実績から limit する。
 */
export const listCommunitiesForProfilePreview = async (params: {
  targetUserId: string
  arrayField: 'members' | 'managers'
  limit: number
  enterpriseId?: string
}): Promise<ShokujiiCommunity[]> => {
  const { targetUserId, arrayField, limit, enterpriseId } = params
  const db = getFirestore()
  const userRef = getUserRef(targetUserId)
  let communitiesQuery = db.collection('communities').where(arrayField, 'array-contains', userRef)
  if (enterpriseId != null && enterpriseId !== '') {
    communitiesQuery = communitiesQuery.where('enterprise_id', '==', enterpriseId)
  }
  const snapshot = await communitiesQuery.limit(limit).withConverter(communityConverter).get()
  return snapshot.docs.map((doc) => doc.data())
}

/**
 * 管理コミュニティ数（親 `communities.managers` 配列に userRef が含まれる件数）。RC-55 同上。
 */
export const countManagedCommunitiesForUser = async (userId: string, enterpriseId?: string): Promise<number> => {
  if (userId === '') {
    return 0
  }
  const db = getFirestore()
  const userRef = getUserRef(userId)
  let q = db.collection('communities').where('managers', 'array-contains', userRef)
  if (enterpriseId != null && enterpriseId !== '') {
    q = q.where('enterprise_id', '==', enterpriseId)
  }
  const snapshot = await q.count().get()
  return snapshot.data().count
}

export const saveCommunity = async (community: ShokujiiCommunity): Promise<void> => {
  const db = getFirestore()
  // toFirestore は未設定の NonEmptyString フィールドを FieldValue.delete() に変換するため、
  // merge なし set だと新規ドキュメント作成時に delete sentinel が拒否され失敗する。merge: true で回避する。
  await db.collection('communities').doc(community.id).withConverter(communityConverter).set(community, { merge: true })
}

/** エンタープライズ CSV 作成時、同一 enterprise 内の community_account が既に存在する */
export class CommunityAccountAlreadyExistsInEnterpriseError extends Error {
  constructor() {
    super('Community account already exists in enterprise')
    this.name = 'CommunityAccountAlreadyExistsInEnterpriseError'
  }
}

/**
 * エンタープライズ向けコミュニティ作成と manager 付与を 1 トランザクションで原子的に行う。
 * 親 `managers` 配列は onCommunityMemberWritten が再集計する。
 */
export const createEnterpriseCommunityWithManager = async (
  community: ShokujiiCommunity,
  managerUserId: string,
): Promise<void> => {
  const enterpriseId = community.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    throw new Error('enterprise_id is required')
  }
  const db = getFirestore()
  await db.runTransaction(async (transaction) => {
    const existing = await getCommunityByAccountInEnterprise(enterpriseId, community.community_account, transaction)
    if (existing != null) {
      throw new CommunityAccountAlreadyExistsInEnterpriseError()
    }
    const communityRef = db.collection('communities').doc(community.id).withConverter(communityConverter)
    // saveCommunity と同様 merge: true（toFirestore の FieldValue.delete 対策）
    transaction.set(communityRef, community, { merge: true })
    const memberRef = db
      .collection('communities')
      .doc(community.id)
      .collection('members')
      .doc(managerUserId)
      .withConverter(communityMemberConverter)
    transaction.set(memberRef, new CommunityMember(managerUserId, { roles: ['manager'] }))
  })
}

export type EnterpriseCommunityRecord = {
  community_id: string
  community_name: string
  community_account: string
  community_num_members: number
  created_at: number
  manager_ids: string[]
}

export const listCommunitiesByEnterpriseId = async (enterpriseId: string): Promise<EnterpriseCommunityRecord[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('communities')
    .where('enterprise_id', '==', enterpriseId)
    .withConverter(communityConverter)
    .get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    const numMembers =
      typeof doc.get('community_num_members') === 'number' ? (doc.get('community_num_members') as number) : 0
    return {
      community_id: doc.id,
      community_name: data.community_name,
      community_account: data.community_account,
      community_num_members: numMembers,
      created_at: data.created_at,
      manager_ids: (data.managers ?? []).map((ref) => ref.id),
    }
  })
}

export const setCommunityMemberWithRoles = async (
  communityId: string,
  userId: string,
  roles: CommunityMemberRolesType[],
): Promise<void> => {
  const db = getFirestore()
  const memberRef = db
    .collection('communities')
    .doc(communityId)
    .collection('members')
    .doc(userId)
    .withConverter(communityMemberConverter)
  await memberRef.set(new CommunityMember(userId, { roles }))
}
