import {
  DocumentData,
  DocumentReference,
  FieldValue,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'
import { Result, ok, err } from '@shokujii/common/utils/result.js'
import { createModuleLogger } from '../utils/logger.js'

const logger = createModuleLogger('userStore')

export class ShokujiiUser extends User {
  // TODO Add other UserPersonalInformation fields
  user_email: string = ''

  constructor(id: string, data: Partial<User> & Partial<UserPersonalInformation>) {
    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}

const userConverter: FirestoreDataConverter<ShokujiiUser> = {
  toFirestore(user: ShokujiiUser): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiUser {
    return new ShokujiiUser(snapshot.id, snapshot.data())
  },
}

const userPersonalInformationConverter: FirestoreDataConverter<UserPersonalInformation> = {
  toFirestore(config: UserPersonalInformation): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserPersonalInformation {
    return new UserPersonalInformation(snapshot.id, snapshot.data())
  },
}

/**
 * users コレクションの DocumentReference（withConverter 付き）を返す。
 * array-contains 等のクエリで使用する際も、必ずこの ref を使うこと。
 */
export const getUserRef = (userId: string): DocumentReference<ShokujiiUser> => {
  const db = getFirestore()
  return db.collection('users').doc(userId).withConverter(userConverter)
}

const USER_IDS_IN_QUERY_CHUNK = 30

/**
 * `user_id` フィールドの IN クエリでユーザーをまとめて取得する（チャンクは Firestore の上限 30）。
 * 戻り値の Map のキーはドキュメント ID（通常は Firebase UID = user_id）。
 */
export const getUsersByUserIds = async (
  userIds: string[],
  transaction?: Transaction,
): Promise<Map<string, ShokujiiUser>> => {
  const unique = [...new Set(userIds)].filter((id) => id !== '')
  const db = getFirestore()
  const result = new Map<string, ShokujiiUser>()

  for (let i = 0; i < unique.length; i += USER_IDS_IN_QUERY_CHUNK) {
    const chunk = unique.slice(i, i + USER_IDS_IN_QUERY_CHUNK)
    if (chunk.length === 0) continue

    const q = db.collection('users').where('user_id', 'in', chunk).withConverter(userConverter)
    const snapshot = transaction === undefined ? await q.get() : await transaction.get(q)
    for (const doc of snapshot.docs) {
      const user = doc.data()
      if (user != null) {
        result.set(doc.id, user)
      }
    }
  }
  return result
}

export const getUser = async (
  userId: string,
  withPersonalInformation: boolean,
  transaction?: Transaction,
): Promise<ShokujiiUser | undefined> => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  const snapshot = transaction === undefined ? await userRef.get() : await transaction.get(userRef)
  let user: ShokujiiUser | undefined
  try {
    user = snapshot.data()
  } catch (error: unknown) {
    logger.warn('Failed to parse user from Firestore', { userId, error: String(error) })
    throw error
  }
  if (user == null) {
    return undefined
  }
  if (withPersonalInformation) {
    const userPersonalInformation = await getUserPersonalInformation(userId, transaction)
    user.user_email = userPersonalInformation?.user_email ?? ''
  }
  return user
}

export const getUserPersonalInformation = async (
  userId: string,
  transaction?: Transaction,
): Promise<UserPersonalInformation | undefined> => {
  const db = getFirestore()
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(userId)
    .withConverter(userPersonalInformationConverter)
  const snapshot =
    transaction === undefined
      ? await userPersonalInformationRef.get()
      : await transaction.get(userPersonalInformationRef)
  return snapshot.data()
}

/**
 * 全ユーザーを取得するジェネレーター
 * Result型でエラーハンドリングを明示的に行う
 *
 * @param withPersonalInformation 個人情報（メールアドレスなど）を含めるか
 * @yields Result<ShokujiiUser> 成功時はユーザー情報、失敗時はエラー情報
 */
export async function* getAllUsers(withPersonalInformation: boolean): AsyncGenerator<Result<ShokujiiUser>> {
  const db = getFirestore()
  const usersSnapshot = await db.collection('users').withConverter(userConverter).get()

  for (const userDoc of usersSnapshot.docs) {
    try {
      const user = userDoc.data()
      if (withPersonalInformation) {
        const userPersonalInformation = await getUserPersonalInformation(user.id)
        user.user_email = userPersonalInformation?.user_email ?? ''
      }
      yield ok(user)
    } catch (error: unknown) {
      logger.warn('Failed to get user', { userId: userDoc.id, error: String(error) })
      yield err(error instanceof Error ? error : new Error(String(error)))
    }
  }
}

export const getUserIdFromEmail = async (user_email: string): Promise<string | undefined> => {
  const db = getFirestore()
  const personalInformationSnapshot = await db
    .collection('users_personal_information')
    .where('user_email', '==', user_email)
    .get()
  return personalInformationSnapshot.docs[0]?.id
}

export const deleteUserDocuments = async (userId: string): Promise<void> => {
  const db = getFirestore()
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(userId)
    .withConverter(userPersonalInformationConverter)
  const results = await Promise.allSettled([getUserRef(userId).delete(), userPersonalInformationRef.delete()])
  const rejected = results.filter((result) => result.status === 'rejected')
  if (rejected.length > 0) {
    throw rejected[0].reason
  }
}

export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(user.id)
    .withConverter(userPersonalInformationConverter)
  const upi = new UserPersonalInformation(user.id, {
    user_email: user.user_email,
  })
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
    await userPersonalInformationRef.set(upi, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
    transaction.set(userPersonalInformationRef, upi, { merge: true })
  }
}

/**
 * 新規登録途中で作成した users / users_personal_information のみ削除する。
 * 他サブコレクションは触らない。
 */
export const deleteNewUserDocuments = async (uid: string): Promise<void> => {
  const db = getFirestore()
  const userRef = getUserRef(uid)
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(uid)
    .withConverter(userPersonalInformationConverter)
  await Promise.all([userRef.delete(), userPersonalInformationRef.delete()])
}

const ANONYMIZED_USER_NAME = '-'

/**
 * ユーザーを匿名化する。既存データを取得し、匿名化した User インスタンスで上書きする。
 * トランザクション内で呼び出すこと。
 */
export const anonymizeUser = async (uid: string, transaction: Transaction): Promise<void> => {
  const existingUser = await getUser(uid, false, transaction)
  const userRef = getUserRef(uid)
  const anonymizedUser = new ShokujiiUser(uid, {
    ...(existingUser ?? {}),
    user_name: ANONYMIZED_USER_NAME,
    user_description: '',
    user_image_url: '',
    user_sns_facebook: '',
    user_sns_facebook_name: '',
    user_sns_twitter: '',
    user_sns_instagram: '',
    user_sns_website: '',
    user_tags: [],
    // user_account は削除（下の update でフィールドごと削除）
    is_deleted: true,
    deleted_at: DateTime.now().toMillis(),
    created_at: existingUser?.created_at ?? DateTime.now().toMillis(),
  })
  transaction.set(userRef, anonymizedUser, { merge: true })
  transaction.update(userRef, { user_account: FieldValue.delete() })
}

/**
 * マイページ用のカウントフィールドのみを更新する。
 * `updated_at` 等の監査フィールドを変えないため、`update` で部分書き込みする
 *（converter 経由の `set` だと `updated_at` まで書き換わるための例外的な扱い）。
 */
export type UserProfileCountsUpdate = {
  participated_event_count: number
  friend_count: number
  joined_community_count: number
  managed_community_count: number
  ordered_food_count: number
}

export const updateUserProfileCounts = async (
  userId: string,
  counts: UserProfileCountsUpdate,
  transaction?: Transaction,
): Promise<void> => {
  const userRef = getUserRef(userId)
  const update = {
    ...counts,
    counts_updated_at: Timestamp.now(),
  }
  if (transaction === undefined) {
    await userRef.update(update)
  } else {
    transaction.update(userRef, update)
  }
}

/**
 * ユーザー個人情報を匿名化する。ドキュメントが存在しない場合も merge で作成する。
 * トランザクション内で呼び出すこと。
 */
export const setUserTags = async (uid: string, tags: string[]): Promise<void> => {
  await getUserRef(uid).update({ user_tags: tags })
}

export const anonymizeUserPersonalInformation = async (uid: string, transaction: Transaction): Promise<void> => {
  const db = getFirestore()
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(uid)
    .withConverter(userPersonalInformationConverter)
  const anonymized = new UserPersonalInformation(uid, {
    user_email: '',
    is_deleted: true,
    deleted_at: DateTime.now().toMillis(),
  })
  transaction.set(userPersonalInformationRef, anonymized, { merge: true })
}
