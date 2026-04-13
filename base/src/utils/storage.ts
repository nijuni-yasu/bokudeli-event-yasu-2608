import { storage, FIREBASE_STORAGE_BASE_URL } from '@shokujii/base/firebase'
import { getBytes, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

export const uploadImage = async (file: File, path: string): Promise<string> => {
  const uploadStorageRef = storageRef(storage, path)
  const snapshot = await uploadBytes(uploadStorageRef, file)
  const url = await getDownloadURL(snapshot.ref)
  return url
}

/** アルバム用: download URL は返さず、contentType は File.type から推論する */
export const uploadAlbumImage = async (file: File, path: string): Promise<void> => {
  const uploadStorageRef = storageRef(storage, path)
  const contentType = file.type !== '' ? file.type : 'application/octet-stream'
  await uploadBytes(uploadStorageRef, file, { contentType })
}

export const copyImage = async (srcPath: string, dstPath: string): Promise<void> => {
  // Client SDK does not support direct copy function,
  // so we need to download the image first.
  const srcStorageRef = storageRef(storage, srcPath)
  const bytes = await getBytes(srcStorageRef)
  const dstStorageRef = storageRef(storage, dstPath)
  await uploadBytes(dstStorageRef, bytes)
}

/**
 * Storage パスから直接ダウンロード URL を生成する（ネットワーク通信なし）。
 * storage.rules で読み取りが許可されているパスに対してのみ使用すること。
 */
export const convertStoragePathToURL = (path: string): string => {
  const bucket = storage.app.options.storageBucket
  if (bucket == null) {
    throw new Error('storageBucket is not configured')
  }
  return `${FIREBASE_STORAGE_BASE_URL}b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
}
