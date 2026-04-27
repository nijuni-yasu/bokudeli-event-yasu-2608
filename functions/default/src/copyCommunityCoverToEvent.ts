import { getStorage } from 'firebase-admin/storage'
import { onCall, HttpsError } from 'firebase-functions/https'
import type { CopyCommunityCoverToEventRequest } from '@shokujii/common/apis/copyCommunityCoverToEvent.js'
import { getCommunityCoverStoragePath, getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getConfigGlobal } from './stores/config.js'
import { getCommunity } from './stores/community.js'
import { getEventInCommunity } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('copyCommunityCoverToEvent')

/**
 * コミュニティの Storage カバーをイベント用パスへサーバーサイドコピーする。
 *
 * コミュニティ側にカバーオブジェクトが無い場合は not-found で失敗する（クライアントは setDoc に進まない想定）。
 */
export const copyCommunityCoverToEvent = onCall<CopyCommunityCoverToEventRequest, Promise<void>>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in')
  }
  const { uid } = request.auth

  const raw: unknown = request.data
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new HttpsError('invalid-argument', 'Request data must be an object')
  }
  const communityIdVal = Reflect.get(raw, 'communityId')
  const eventIdVal = Reflect.get(raw, 'eventId')
  if (typeof communityIdVal !== 'string' || communityIdVal.trim() === '') {
    throw new HttpsError('invalid-argument', 'communityId must be a non-empty string')
  }
  if (typeof eventIdVal !== 'string' || eventIdVal.trim() === '') {
    throw new HttpsError('invalid-argument', 'eventId must be a non-empty string')
  }
  const communityId = communityIdVal.trim()
  const eventId = eventIdVal.trim()

  const [community, config] = await Promise.all([getCommunity(communityId), getConfigGlobal()])
  if (community == null) {
    throw new HttpsError('not-found', 'Community not found')
  }
  const isSupport = config?.isSupport(uid) ?? false
  const isManager = await community.hasRole(uid, 'manager')
  if (!isSupport && !isManager) {
    throw new HttpsError('permission-denied', 'Forbidden')
  }

  const existingEvent = await getEventInCommunity(communityId, eventId)
  if (existingEvent != null && existingEvent.community_id !== communityId) {
    throw new HttpsError('failed-precondition', 'Event does not belong to the specified community')
  }

  const srcPath = getCommunityCoverStoragePath(communityId)
  const dstPath = getEventCoverStoragePath(communityId, eventId)
  const bucket = getStorage().bucket()
  const srcFile = bucket.file(srcPath)

  const [exists] = await srcFile.exists()
  if (!exists) {
    logger.warn('Source community cover does not exist', { srcPath, communityId, eventId })
    throw new HttpsError('not-found', 'Community cover image not found in Storage')
  }

  try {
    await srcFile.copy(dstPath)
  } catch (error) {
    logger.error('Failed to copy community cover to event', { error, srcPath, dstPath, communityId, eventId })
    throw new HttpsError('internal', 'Failed to copy community cover image')
  }
})
