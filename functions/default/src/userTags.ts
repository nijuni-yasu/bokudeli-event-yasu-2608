import { onCall, HttpsError } from 'firebase-functions/https'
import { createModuleLogger } from './utils/logger.js'
import { getUser, getUserRef, ShokujiiUser } from './stores/user.js'
import { normalizeTag, normalizeTagList } from '@shokujii/common/utils/normalizeTag.js'
import type { UpdateUserTagsRequest, AddTagToMyProfileRequest } from '@shokujii/common/apis/userTags.js'

const logger = createModuleLogger('userTags')

const MAX_TAGS = 10
const MAX_TAG_LEN = 20

export const updateUserTags = onCall<UpdateUserTagsRequest, Promise<{ success: boolean; message: string }>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const raw = request.data?.tags
    if (!Array.isArray(raw) || !raw.every((t) => typeof t === 'string')) {
      throw new HttpsError('invalid-argument', 'tags が不正です')
    }
    const normalized = normalizeTagList(raw)
    if (normalized.length > MAX_TAGS) {
      throw new HttpsError('invalid-argument', `タグは最大${MAX_TAGS}個までです`)
    }
    for (const t of normalized) {
      if (t.length > MAX_TAG_LEN) {
        throw new HttpsError('invalid-argument', `各タグは最大${MAX_TAG_LEN}文字までです`)
      }
    }

    const existing = await getUser(uid, false)
    if (existing == null) {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    const updated = new ShokujiiUser(uid, { ...existing, user_tags: normalized })
    await getUserRef(uid).set(updated, { merge: true })
    logger.info('user_tags 更新', { uid, count: normalized.length })
    return { success: true, message: '' }
  },
)

export const addTagToMyProfile = onCall<AddTagToMyProfileRequest, Promise<{ success: boolean; message: string }>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const rawTag = request.data?.tag
    if (typeof rawTag !== 'string') {
      throw new HttpsError('invalid-argument', 'tag が不正です')
    }
    const tag = normalizeTag(rawTag)
    if (tag.length === 0) {
      throw new HttpsError('invalid-argument', 'タグが空です')
    }
    if (tag.length > MAX_TAG_LEN) {
      throw new HttpsError('invalid-argument', `タグは最大${MAX_TAG_LEN}文字までです`)
    }

    const existing = await getUser(uid, false)
    if (existing == null) {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    const current = normalizeTagList([...(existing.user_tags ?? [])])
    if (current.includes(tag)) {
      return { success: true, message: '既に設定済みです' }
    }
    if (current.length >= MAX_TAGS) {
      throw new HttpsError('failed-precondition', `タグは最大${MAX_TAGS}個までです`)
    }
    const updated = new ShokujiiUser(uid, { ...existing, user_tags: [...current, tag] })
    await getUserRef(uid).set(updated, { merge: true })
    logger.info('user_tags 1件追加', { uid, tag })
    return { success: true, message: '' }
  },
)
