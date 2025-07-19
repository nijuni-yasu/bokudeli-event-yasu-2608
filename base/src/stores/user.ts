import { type Ref } from 'vue'
import { db } from '@shokujii/base/firebase'
import { doc, updateDoc, onSnapshot, DocumentReference, type Unsubscribe } from 'firebase/firestore'
import type { StateTree, Store } from 'pinia'
import { FirestoredUser } from '@shokujii/base/schemes/storedUser'
import { storage } from '@shokujii/base/firebase'
import { ref as storageRef, uploadBytes, getMetadata } from 'firebase/storage'
import { format } from 'date-fns'

type UserStoreState = {
  exists: Ref<boolean | null>
  user: Ref<FirestoredUser | null>
} & StateTree

type UserStoreAction = {
  updateUser: (data: FirestoredUser) => Promise<void>
  uploadUserImage: (file: File | Blob) => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
}

export type UserStore = Store<string, UserStoreState, Record<string, never>, UserStoreAction>

export const useUserStore = (userId: string) => {
  const store = defineStore<string, UserStoreState & UserStoreAction>(`/users/${userId}`, () => {
    const userRef: DocumentReference = doc(db, 'users', userId)
    const exists = ref<boolean | null>(null)
    const user = ref<FirestoredUser | null>(null)

    const updateUser = async (data: FirestoredUser) => {
      await updateDoc(userRef, data.convertToDocumentData())
    }

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
          user.value = exists.value ? new FirestoredUser(userSnapshot.data()) : null
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
