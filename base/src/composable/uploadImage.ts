import { storage } from '@shokujii/base/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

const rebuildFilename = (filename: string) => {
  const splitted = filename.split('.')
  const ext = splitted.pop()
  const name = splitted.join('.')
  return `${name}-${Date.now()}.${ext}`
}

export const uploadEventImage = async (communityId: string, eventId: string, file: File) => {
  const filename = rebuildFilename(file.name)
  const uploadStorageRef = storageRef(storage, `communities/${communityId}/events/${eventId}/${filename}`)
  try {
    const snapshot = await uploadBytes(uploadStorageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error(error)
  }
  return null
}

export const uploadCommunityImage = async (communityId: string, file: File) => {
  const filename = rebuildFilename(file.name)
  const uploadStorageRef = storageRef(storage, `communities/${communityId}/community/${filename}`)
  try {
    const snapshot = await uploadBytes(uploadStorageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error(error)
  }
  return null
}

export const uploadShopImage = async (partnerId: string, shopId: string, file: File) => {
  const filename = rebuildFilename(file.name)
  const uploadStorageRef = storageRef(storage, `partners/${partnerId}/shops/${shopId}/${filename}`)
  try {
    const snapshot = await uploadBytes(uploadStorageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error(error)
  }
  return null
}

export const uploadMenuImage = async (partnerId: string, menuId: string, file: File) => {
  const filename = rebuildFilename(file.name)
  const uploadStorageRef = storageRef(storage, `partners/${partnerId}/menus/${menuId}/${filename}`)
  try {
    const snapshot = await uploadBytes(uploadStorageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error(error)
  }
  return null
}
