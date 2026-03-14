import { storage } from '@shokujii/base/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

export const uploadImage = async (file: File, path: string): Promise<string> => {
  const uploadStorageRef = storageRef(storage, path)
  const snapshot = await uploadBytes(uploadStorageRef, file)
  const url = await getDownloadURL(snapshot.ref)
  return url
}
