import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/https'
import { createModuleLogger } from './utils/logger.js'
import {
  hasSoleManagerCommunity,
  getCommunitiesWhereUserIsMember,
  removeMemberFromCommunity,
} from './stores/community.js'
import { getPassCodeRefsByUserId, getPassCodeRefsByUserEmail } from './stores/passCode.js'
import { listFriendUserIds } from './stores/userFriend.js'
import { anonymizeUser, anonymizeUserPersonalInformation, getUserPersonalInformation } from './stores/user.js'
import { recountUserProfileCountsForUsers } from './utils/recountUserProfileCounts.js'
import { listChatMembershipsForUser, getChatMembershipRef } from './stores/chatMembership.js'
import { getChatRoom, getChatRoomRef } from './stores/chatRoom.js'

const db = getFirestore()
const logger = createModuleLogger('deleteUserAccount')
const FIRESTORE_BATCH_LIMIT = 500

const cleanupUserChatData = async (uid: string): Promise<void> => {
  const memberships = await listChatMembershipsForUser(uid)
  if (memberships.length === 0) {
    return
  }

  const roomIds = [...new Set(memberships.map((membership) => membership.room_id))]

  for (let i = 0; i < roomIds.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch()
    const chunk = roomIds.slice(i, i + FIRESTORE_BATCH_LIMIT)
    let writeCount = 0
    for (const roomId of chunk) {
      const room = await getChatRoom(roomId)
      if (room == null || !room.member_user_ids.includes(uid)) {
        continue
      }
      batch.update(getChatRoomRef(roomId), {
        member_user_ids: FieldValue.arrayRemove(uid),
      })
      writeCount++
    }
    if (writeCount > 0) {
      await batch.commit()
    }
  }

  for (let i = 0; i < memberships.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch()
    const chunk = memberships.slice(i, i + FIRESTORE_BATCH_LIMIT)
    for (const membership of chunk) {
      batch.delete(getChatMembershipRef(uid, membership.room_id))
    }
    await batch.commit()
  }
}

export const deleteUserAccount = onCall<unknown, Promise<{ success: true }>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  try {
    await db.runTransaction(async (transaction) => {
      // 唯一管理者チェックを最初に実行（NG の場合は早期リターンで不要な読み込みを避ける）
      if (await hasSoleManagerCommunity(uid, transaction)) {
        throw new HttpsError(
          'failed-precondition',
          '管理者があなたのみのコミュニティがあるため、アカウントを削除できません。先に他の管理者を追加するか、該当コミュニティから退会してください。',
        )
      }

      // 読み取りフェーズ: transaction ではすべての読み取りを書き込みより先に実行する
      // 所属コミュニティを取得
      const memberCommunities = await getCommunitiesWhereUserIsMember(uid, transaction)

      // pass_code の取得（user_id または user_email で検索し、メールアドレスの個人情報が残らないようにする）
      const passCodeRefsByUserId = await getPassCodeRefsByUserId(uid, transaction)
      const userPersonalInformation = await getUserPersonalInformation(uid, transaction)
      const userEmail = userPersonalInformation?.user_email

      const passCodeRefPathSet = new Set<string>()
      const passCodeRefs: typeof passCodeRefsByUserId = []
      for (const ref of passCodeRefsByUserId) {
        if (!passCodeRefPathSet.has(ref.path)) {
          passCodeRefPathSet.add(ref.path)
          passCodeRefs.push(ref)
        }
      }
      if (userEmail != null && userEmail !== '') {
        const passCodeRefsByEmail = await getPassCodeRefsByUserEmail(userEmail, transaction)
        for (const ref of passCodeRefsByEmail) {
          if (!passCodeRefPathSet.has(ref.path)) {
            passCodeRefPathSet.add(ref.path)
            passCodeRefs.push(ref)
          }
        }
      }

      // 書き込みフェーズ
      // users を匿名化（内部で getUser 読み取り後に set/update）
      await anonymizeUser(uid, transaction)

      // users_personal_information を匿名化（ドキュメントが存在しない場合も merge で作成）
      await anonymizeUserPersonalInformation(uid, transaction)

      // 各コミュニティの members サブコレクションから削除
      for (const communityDoc of memberCommunities) {
        await removeMemberFromCommunity(communityDoc.id, uid, transaction)
      }

      // pass_code を削除（メールアドレス等の個人情報が残らないようにする）
      for (const ref of passCodeRefs) {
        transaction.delete(ref)
      }
    })

    // RC-50: 退会者の友人相手側 friend_count を再集計（一覧除外ルールとキャッシュを一致させる）
    try {
      const friendUserIds = (await listFriendUserIds(uid)).filter((id) => id !== '' && id !== uid)
      await recountUserProfileCountsForUsers(friendUserIds)
    } catch (error) {
      logger.error('recountUserProfileCountsForUsers failed after deleteUserAccount', { userId: uid, error })
    }

    await cleanupUserChatData(uid)

    // Firebase Auth のアカウントを削除（auth/user-not-found は既に削除済みのため成功扱い）
    try {
      await getAuth().deleteUser(uid)
    } catch (authError: unknown) {
      const code = (authError as { code?: string })?.code
      if (code === 'auth/user-not-found') {
        // 二重送信等で既に削除済みの場合は成功扱い
        logger.info('deleteUserAccount: user already deleted', { userId: uid })
      } else {
        throw authError
      }
    }

    logger.info('deleteUserAccount succeeded', { userId: uid })
    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error
    }
    logger.error('deleteUserAccount failed', { userId: uid, error })
    throw new HttpsError('internal', '処理に失敗しました。しばらくして再度お試しください')
  }
})
