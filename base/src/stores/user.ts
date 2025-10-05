import { ref } from 'vue'
import { defineStore } from 'pinia'
import { format } from 'date-fns'
import {
  doc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getMetadata } from 'firebase/storage'
import { db, storage } from '@shokujii/base/firebase.js'
import { User } from '@shokujii/common/schemas/User.js'

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User {
    const data = snapshot.data(options)
    return new User(snapshot.id, data)
  },
}

export type UserStore = ReturnType<typeof useUserStore>

export const useUserStore = (userId: string) => {
  const store = defineStore(`/users/${userId}`, () => {
    const userRef = doc(db, 'users', userId).withConverter(userConverter)
    const exists = ref<boolean | null>(null)
    const user = ref<User | null>(null)

    const updateUser = async (data: User) => {
      await setDoc(userRef, data, { merge: true })
    }

    /**
     * functions にも同じ関数があるので注意
     * TODO: 共通化
     * @param file
     */
    const uploadUserImage = async (file: File | Blob) => {
      let ext: string = ''
      if (file instanceof File) {
        const _ext = file.name.split('.').pop()
        ext = _ext ? '.' + _ext : ''
      }
      const stem = `avatar_${format(Date.now(), 'yyyyMMddHHmmss')}`
      const filepath = `/users/${userId}/${stem}${ext}`
      const imageRef = storageRef(storage, filepath)
      const contentType = file.type != null && file.type !== '' ? file.type : 'image/*'
      const snapshot = await uploadBytes(imageRef, file, { contentType })
      const metadata = await getMetadata(snapshot.ref)
      const user_image_url = `gs://${metadata.bucket}/${metadata.fullPath}`
      // 画像のサイズ変換が終わるまで待つ
      // ポーリングはあまり良い方法ではないが、リサイズ完了を検知する方法がないため
      let retry = 0
      const MAX_RETRY = 200 // 20秒
      for (; retry < MAX_RETRY; retry++) {
        await new Promise((resolve) => window.setTimeout(resolve, 100))
        try {
          await Promise.all(
            ['small', 'medium', 'large'].map(async (size) => {
              const resizedImageRef = storageRef(storage, `/users/${userId}/${stem}_thumb_${size}${ext}`)
              await getMetadata(resizedImageRef)
            }),
          )
          break
        } catch {
          // Do nothing
        }
      }
      if (retry === MAX_RETRY) {
        throw new Error('Failed to resize image')
      }

      await updateDoc(userRef, { user_image_url })
    }

    let unsubscribeUser: Unsubscribe | null = null
    const subscribe = () => {
      if (unsubscribeUser == null) {
        unsubscribeUser = onSnapshot(userRef, (userSnapshot) => {
          exists.value = userSnapshot.exists()
          user.value = userSnapshot.data() ?? null
        })
      }
    }

    subscribe()

    return {
      exists,
      user,
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
