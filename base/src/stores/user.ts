import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
  type DocumentReference,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getMetadata } from 'firebase/storage'
import { User } from '@shokujii/common/schemas/User.js'
import { getUserImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { db, storage } from '@shokujii/base/firebase.js'
import { useUserImageCacheStore } from '@shokujii/base/stores/userImageCache.js'

/** Storage metadata.updated の比較。nullish のときは getMetadata 成功（存在確認）を優先する。 */
const isStorageUpdatedAfter = (objectUpdated: string | undefined, referenceUpdated: string | undefined): boolean => {
  if (objectUpdated == null || referenceUpdated == null) {
    return true
  }
  return objectUpdated > referenceUpdated
}

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User {
    const data = snapshot.data(options)
    return new User(snapshot.id, data)
  },
}

/**
 * users コレクションの DocumentReference（withConverter 付き）を返す。
 * array-contains 等のクエリで使用する際も、必ずこの ref を使うこと。
 */
export const getUserRef = (userId: string): DocumentReference<User> => {
  return doc(db, 'users', userId).withConverter(userConverter)
}

export const getUserById = async (userId: string): Promise<User | undefined> => {
  const snapshot = await getDoc(getUserRef(userId))
  return snapshot.exists() ? snapshot.data() : undefined
}

export type UserStore = ReturnType<typeof useUserStore>

type UseUserStoreOptions = {
  /** false のとき onSnapshot を開始しない（enterprise preview ゲート前の Firestore 直読回避等） */
  autoSubscribe?: boolean
}

export const useUserStore = (userId: string, options?: UseUserStoreOptions) => {
  const store = defineStore(`/users/${userId}`, () => {
    const userRef = getUserRef(userId)
    const exists = ref<boolean | null>(null)
    const user = ref<User | null>(null)

    // null はローディング中を表すので、存在しないユーザーは undefined で返す
    const getLoadedUser = async (): Promise<User | undefined> => {
      return new Promise((resolve) => {
        watch(
          [user, exists],
          ([_user, _exists]: [User | null, boolean | null]) => {
            if (_user != null || _exists != null) {
              resolve(_user ?? undefined)
            }
          },
          { immediate: true },
        )
      })
    }

    const updateUser = async (data: User) => {
      await setDoc(userRef, data, { merge: true })
    }

    /**
     * functions にも同じ関数があるので注意
     * TODO: 共通化
     * @param file
     */
    const uploadUserImage = async (file: File | Blob) => {
      const filepath = getUserImageStoragePath(userId)
      const imageRef = storageRef(storage, filepath)
      const contentType = file.type != null && file.type !== '' ? file.type : 'image/*'
      const snapshot = await uploadBytes(imageRef, file, { contentType })
      const metadata = await getMetadata(snapshot.ref)
      const uploadUpdated = metadata.updated
      const user_image_url = `gs://${metadata.bucket}/${metadata.fullPath}`
      // 画像のサイズ変換が終わるまで待つ
      // ポーリングはあまり良い方法ではないが、リサイズ完了を検知する方法がないため
      let retry = 0
      const MAX_RETRY = 200 // 20秒
      for (; retry < MAX_RETRY; retry++) {
        await new Promise((resolve) => window.setTimeout(resolve, 100))
        try {
          const thumbsReady = await Promise.all(
            (['small', 'medium', 'large'] as const).map(async (size) => {
              const resizedImageRef = storageRef(storage, getUserImageStoragePath(userId, size))
              const thumbMetadata = await getMetadata(resizedImageRef)
              return isStorageUpdatedAfter(thumbMetadata.updated, uploadUpdated)
            }),
          )
          if (thumbsReady.every(Boolean)) {
            break
          }
        } catch {
          // Do nothing
        }
      }
      if (retry === MAX_RETRY) {
        throw new Error('Failed to resize image')
      }

      await updateDoc(userRef, { user_image_url })
      useUserImageCacheStore().bump(userId)
    }

    let unsubscribeUser: Unsubscribe | null = null
    const subscribe = () => {
      if (unsubscribeUser == null) {
        unsubscribeUser = onSnapshot(userRef, (userSnapshot) => {
          exists.value = userSnapshot.exists()
          user.value = userSnapshot.data() ?? new User(userId, {})
        })
      }
    }

    if (options?.autoSubscribe !== false) {
      subscribe()
    }

    return {
      exists,
      user,
      getLoadedUser,
      updateUser,
      uploadUserImage,
      subscribe,
      unsubscribe: () => {
        unsubscribeUser?.()
        unsubscribeUser = null
      },
    }
  })
  return store()
}
