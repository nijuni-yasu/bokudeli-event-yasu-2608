import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@shokujii/base/firebase'
import type {
  UpdateUserTagsRequest,
  AddTagToMyProfileRequest,
  RemoveTagFromMyProfileRequest,
} from '@shokujii/common/apis/userTags.js'
import { normalizeTag } from '@shokujii/common/utils/normalizeTag.js'

type TagResponse = { success: boolean; message: string }

export const updateUserTags = async (tags: string[]): Promise<HttpsCallableResult<TagResponse>> => {
  const f = httpsCallable<UpdateUserTagsRequest, TagResponse>(functions, 'updateUserTags')
  return f({ tags })
}

export const addTagToMyProfile = async (tag: string): Promise<HttpsCallableResult<TagResponse>> => {
  const f = httpsCallable<AddTagToMyProfileRequest, TagResponse>(functions, 'addTagToMyProfile')
  return f({ tag })
}

export const removeTagFromMyProfile = async (tag: string): Promise<HttpsCallableResult<TagResponse>> => {
  const f = httpsCallable<RemoveTagFromMyProfileRequest, TagResponse>(functions, 'removeTagFromMyProfile')
  return f({ tag })
}

/**
 * 他人のタグ / イベント上のタグをクリックしたとき、
 * 自分のプロフィールにまだなければ追加し、既にあれば外す。
 */
export const toggleTagOnMyProfile = async (
  tag: string,
  currentUserTags: string[] | undefined,
): Promise<'added' | 'removed'> => {
  const t = normalizeTag(tag)
  if (t.length === 0) {
    throw new Error('タグが空です')
  }
  const current = (currentUserTags ?? []).map((s) => normalizeTag(s)).filter((s) => s.length > 0)
  if (current.includes(t)) {
    await removeTagFromMyProfile(t)
    return 'removed'
  }
  await addTagToMyProfile(t)
  return 'added'
}
