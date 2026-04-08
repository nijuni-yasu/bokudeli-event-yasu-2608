import * as path from 'path'
import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { getStorage } from 'firebase-admin/storage'
import { createModuleLogger } from './utils/logger.js'
import { getUserImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { resizeImage } from './utils/image.js'

const logger = createModuleLogger('userImage')
const storage = getStorage()

const USER_THUMBNAILS = [
  {
    suffix: 'small',
    size: 50,
  },
  {
    suffix: 'medium',
    size: 100,
  },
  {
    suffix: 'large',
    size: 500,
  },
] as const

/**
 * Handles thumbnail generation for user-uploaded images.
 *
 * You can find the design policy of Storage Trigger (onObjectFinalized) in README.md.
 */
export const generateUserImageThumbnail = onObjectFinalized(
  { region: 'asia-northeast1', memory: '1GiB' },
  async (event) => {
    const object = event.data
    const imagePath = object.name
    const contentType = object.contentType
    const imageName = path.posix.basename(imagePath) // posix.basename is used because Storage path is always '/' separated
    const pathParts = imagePath.split('/') // Do not use path.sep because Storage path is always '/' separated
    const userId = pathParts[1]
    if (
      pathParts[0] !== 'users' ||
      pathParts.length !== 3 ||
      contentType == null ||
      !contentType.startsWith('image/') ||
      !imageName.startsWith('avatar') ||
      imageName.includes('_thumb_') ||
      userId == null // userId is not null because pathParts.length === 3, but for TypeScript to know it, it's better to add this condition
    ) {
      // return without logging because it is expected to happen frequently
      return
    }

    const bucket = storage.bucket(object.bucket)
    let imageBuffer: Buffer
    try {
      const [buffer] = await bucket.file(imagePath).download()
      imageBuffer = buffer
    } catch (error) {
      logger.error('Failed to download image file. It might not exist.', { error, imagePath })
      return
    }
    const results = await Promise.allSettled(
      USER_THUMBNAILS.map(async (thumbnail) => {
        // resizeImage throws errors, but we don't need to handle them here because we are using Promise.allSettled
        const thumbBuffer = await resizeImage(imageBuffer, thumbnail.size)
        await bucket.file(getUserImageStoragePath(userId, thumbnail.suffix)).save(thumbBuffer, {
          metadata: {
            contentType,
          },
        })
      }),
    )
    const errors = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (errors.length > 0) {
      logger.error('Failed to generate some thumbnails', { errors: errors.map((e) => e.reason) })
    }
  },
)
