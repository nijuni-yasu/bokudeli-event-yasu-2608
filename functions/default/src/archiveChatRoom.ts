import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { findEventChatRoom, getChatRoom, saveChatRoom, setChatRoomInactive } from './stores/chatRoom.js'
import { getChatMembershipRef, setMembershipInactive } from './stores/chatMembership.js'

const logger = createModuleLogger('archiveChatRoom')

const MEMBERSHIP_BATCH_SIZE = 500

export async function archiveChatRoom(roomId: string): Promise<void> {
  const room = await getChatRoom(roomId)
  if (room == null) {
    logger.info('Chat room not found; skip archive', { roomId })
    return
  }
  if (!room.is_active) {
    logger.info('Chat room already archived', { roomId })
    return
  }

  await saveChatRoom(setChatRoomInactive(room))

  const memberUserIds = room.member_user_ids
  const db = getFirestore()
  for (let i = 0; i < memberUserIds.length; i += MEMBERSHIP_BATCH_SIZE) {
    const chunk = memberUserIds.slice(i, i + MEMBERSHIP_BATCH_SIZE)
    // membership を並列取得して逐次 read を避ける
    const membershipRefs = chunk.map((userId) => getChatMembershipRef(userId, roomId))
    const snapshots = await Promise.all(membershipRefs.map((ref) => ref.get()))
    const batch = db.batch()
    let writeCount = 0

    for (let j = 0; j < chunk.length; j++) {
      const membership = snapshots[j].exists ? snapshots[j].data() : undefined
      if (membership == null || !membership.is_active) {
        continue
      }
      batch.set(membershipRefs[j], setMembershipInactive(membership), { merge: true })
      writeCount++
    }

    if (writeCount > 0) {
      await batch.commit()
    }
  }

  logger.info('Chat room archived', { roomId, memberCount: memberUserIds.length })
}

export async function archiveEventChatRoom(communityId: string, eventId: string): Promise<void> {
  const room = await findEventChatRoom(communityId, eventId)
  if (room == null) {
    return
  }
  await archiveChatRoom(room.id)
}
