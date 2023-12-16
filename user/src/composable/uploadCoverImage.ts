import { storage } from '@/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

const rebuildFilename = (filename: string) => {
  const splitted = filename.split('.')
  const ext = splitted.pop()
  const name = splitted.join('.')
  return `${name}-${Date.now()}.${ext}`
}

const uploadCoverImage = async (communityId: string, eventId: string, file: File) => {
  const filename = rebuildFilename(file.name)
  const uploadStorageRef = eventId.length>0
    ? storageRef(storage, `communities/${communityId}/events/${eventId}/${filename}`)
    : storageRef(storage, `communities/${communityId}/community/${filename}`)
  try {
    const snapshot = await uploadBytes(uploadStorageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error(error)
  }

  return null
}

export default uploadCoverImage
