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

const EXPIRED_TIME = 7 * 1000 * 60 * 60 * 24 // 7 days

const communityMemberConverter: FirestoreDataConverter<CommunityMember> = {
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

  async generateInvitationUrlForManager(uid: string): Promise<string> {
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
    return getCommunityInvitationUrl(this.community_account, inviteRef.id)
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

export const getCommunityByAccount = async (
  communityAccount: string,
  transaction?: Transaction,
): Promise<ShokujiiCommunity | undefined> => {
  const db = getFirestore()
  const communityRef = db
    .collection('communities')
    .where('community_account', '==', communityAccount)
    .withConverter(communityConverter)

  const snapshot = await (transaction === undefined ? communityRef.get() : transaction.get(communityRef))
  return snapshot.empty ? undefined : snapshot.docs[0].data()
}
