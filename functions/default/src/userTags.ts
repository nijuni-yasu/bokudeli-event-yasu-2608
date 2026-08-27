import { onCall, HttpsError } from 'firebase-functions/https'
import { createModuleLogger } from './utils/logger.js'
import { addUserTag, removeUserTag, getUser, setUserTags } from './stores/user.js'
import { normalizeTag, normalizeTagList, tagCodePointLength } from '@shokujii/common/utils/normalizeTag.js'
import type {
  UpdateUserTagsRequest,
  UpdateUserTagsResponse,
  AddTagToMyProfileRequest,
  AddTagToMyProfileResponse,
  RemoveTagFromMyProfileRequest,
  RemoveTagFromMyProfileResponse,
} from '@shokujii/common/apis/userTags.js'

const logger = createModuleLogger('userTags')

const MAX_TAGS = 10
const MAX_TAG_LEN = 20

export const updateUserTags = onCall<UpdateUserTagsRequest>(async (request): Promise<UpdateUserTagsResponse> => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }
  const raw = request.data?.tags
  if (!Array.isArray(raw) || !raw.every((t) => typeof t === 'string')) {
    throw new HttpsError('invalid-argument', 'tags が不正です')
  }
  for (const t of raw) {
    if (normalizeTag(t).length === 0) {
      throw new HttpsError('invalid-argument', '空または空白のみのタグは指定できません')
    }
  }
  const normalized = normalizeTagList(raw)
  if (normalized.length > MAX_TAGS) {
    throw new HttpsError('invalid-argument', `タグは最大${MAX_TAGS}個までです`)
  }
  for (const t of normalized) {
    if (tagCodePointLength(t) > MAX_TAG_LEN) {
      throw new HttpsError('invalid-argument', `各タグは最大${MAX_TAG_LEN}文字までです`)
    }
  }

  const existing = await getUser(uid, false)
  if (existing == null) {
    throw new HttpsError('not-found', 'ユーザーが見つかりません')
  }
  await setUserTags(uid, normalized)
  logger.info('user_tags 更新', { uid, count: normalized.length })
  return { success: true, message: '' }
})

export const addTagToMyProfile = onCall<AddTagToMyProfileRequest>(
  async (request): Promise<AddTagToMyProfileResponse> => {
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
    if (tagCodePointLength(tag) > MAX_TAG_LEN) {
      throw new HttpsError('invalid-argument', `タグは最大${MAX_TAG_LEN}文字までです`)
    }

    const result = await addUserTag(uid, tag, MAX_TAGS)
    if (result === 'userNotFound') {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    if (result === 'alreadyExists') {
      return { success: true, message: '既に設定済みです' }
    }
    if (result === 'limitExceeded') {
      throw new HttpsError('failed-precondition', `タグは最大${MAX_TAGS}個までです`)
    }

    logger.info('user_tags 1件追加', { uid, tag })
    return { success: true, message: '' }
  },
)

export const removeTagFromMyProfile = onCall<RemoveTagFromMyProfileRequest>(
  async (request): Promise<RemoveTagFromMyProfileResponse> => {
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

    const result = await removeUserTag(uid, tag)
    if (result === 'userNotFound') {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    if (result === 'notFound') {
      return { success: true, message: '既に削除済みです' }
    }

    logger.info('user_tags 1件削除', { uid, tag })
    return { success: true, message: '' }
  },
)
