import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { functions } from '@shokujii/base/firebase'
import type { UpdateUserTagsRequest, AddTagToMyProfileRequest } from '@shokujii/common/apis/userTags.js'
import { normalizeTag, normalizeTagList } from '@shokujii/common/utils/normalizeTag.js'

type TagResponse = { success: boolean; message: string }

export const updateUserTags = async (tags: string[]): Promise<HttpsCallableResult<TagResponse>> => {
  const f = httpsCallable<UpdateUserTagsRequest, TagResponse>(functions, 'updateUserTags')
  return f({ tags })
}

export const addTagToMyProfile = async (tag: string): Promise<HttpsCallableResult<TagResponse>> => {
  const f = httpsCallable<AddTagToMyProfileRequest, TagResponse>(functions, 'addTagToMyProfile')
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
  const current = normalizeTagList([...(currentUserTags ?? [])])
  if (current.includes(t)) {
    await updateUserTags(current.filter((x) => x !== t))
    return 'removed'
  }
  await addTagToMyProfile(t)
  return 'added'
}
