import { storage, FIREBASE_STORAGE_BASE_URL } from '@shokujii/base/firebase'
import { ref as storageRef, uploadBytes, getBlob } from 'firebase/storage'
import {
  CHAT_ATTACHMENT_IMAGE_MIME_TYPES,
  type ChatAttachmentImageMimeType,
} from '@shokujii/common/schemas/ChatMessage.js'

export const uploadImage = async (file: File, path: string): Promise<void> => {
  const uploadStorageRef = storageRef(storage, path)
  await uploadBytes(uploadStorageRef, file)
}

/** アルバム用: download URL は返さず、contentType は File.type から推論する */
export const uploadAlbumImage = async (file: File, path: string): Promise<void> => {
  const uploadStorageRef = storageRef(storage, path)
  const contentType = file.type !== '' ? file.type : 'application/octet-stream'
  await uploadBytes(uploadStorageRef, file, { contentType })
}

/** チャット画像添付: contentType を明示（空 type は呼び出し側で拒否すること） */
export const uploadChatAttachment = async (
  file: File,
  path: string,
  contentType: ChatAttachmentImageMimeType,
): Promise<void> => {
  const uploadStorageRef = storageRef(storage, path)
  await uploadBytes(uploadStorageRef, file, { contentType })
}

/** メンバー限定 read を強制する取得（getDownloadURL は使わない） */
export const getChatAttachmentBlob = async (path: string): Promise<Blob> => {
  const uploadStorageRef = storageRef(storage, path)
  return getBlob(uploadStorageRef)
}

export const isAllowedChatAttachmentMimeType = (mimeType: string): mimeType is ChatAttachmentImageMimeType => {
  return (CHAT_ATTACHMENT_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
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
