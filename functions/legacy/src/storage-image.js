import path from 'path'
import functions from 'firebase-functions/v1'
import { getStorage } from 'firebase-admin/storage'
import sharp from 'sharp'

const storage = getStorage()

const USER_THUMBNAILS = {
  small: 50,
  medium: 100,
  large: 500,
}

const uploadThumbnails = async (object, thumbs) => {
  const bucket = storage.bucket(object.bucket)
  const imagePath = object.name
  const imageExt = path.extname(imagePath)
  const imageName = path.basename(imagePath, imageExt)
  const imageBuffer = (
    await bucket
      .file(imagePath)
      .download()
      .catch(() => {
        // imageBuffer will be null, so we do not need to handle the error
      })
  )[0]
  if (imageBuffer == null) {
    console.error('file not found')
    return
  }
  const image = sharp(imageBuffer)
  const { width, height } = await image.metadata()
  return Promise.all(
    Object.entries(thumbs).map(async ([prefix, size]) => {
      const options = {}
      if (width > height) {
        options.width = size
      } else {
        options.height = size
      }
      const thumbnailImage = image.resize({
        ...options,
        withoutEnlargement: true,
      })

      const thumbFileName = `${imageName}_thumb_${prefix}${imageExt}`
      const thumbFilePath = path.join(path.dirname(imagePath), thumbFileName)
      return bucket.file(thumbFilePath).save(await thumbnailImage.toBuffer(), {
        metadata: {
          contentType: object.contentType,
        },
      })
    }),
  )
}

export const on_object_finalized = functions
  .region('asia-northeast1')
  .storage.object()
  .onFinalize(async (object) => {
    const contentType = object.contentType
    if (!contentType.startsWith('image/')) {
      return
    }
    const imagePath = object.name
    const imageName = path.basename(imagePath, path.extname(imagePath))
    if (!imageName.startsWith('avatar') || imageName.includes('_thumb_')) {
      return
    }
    if (imagePath.split(path.sep)[0] === 'users') {
      return uploadThumbnails(object, USER_THUMBNAILS)
    }
  })
