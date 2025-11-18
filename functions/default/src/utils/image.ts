import { buildThumbnailsLinks } from '@shokujii/common/utils/buildThumbnailsLinks.js'

type Sizes = 'large' | 'medium' | 'small'

/**
 * Get thumbnail URL for user image with custom size
 * @param userId - The user ID
 * @param imageUrl - The image URL (can be gs:// or https://)
 * @param sizeValue - The size in pixels (e.g., 50, 100, 500)
 * @returns Thumbnail URL or empty string if no image
 */
export function getUserImageUrl(userId: string, imageUrl: string | undefined, size: Sizes): string {
  if (!imageUrl) {
    return ''
  }

  try {
    const url = new URL(imageUrl)

    const thumbnails = buildThumbnailsLinks(userId, url)
    if (thumbnails && thumbnails[size]) {
      return thumbnails[size]
    } else {
      return imageUrl
    }
  } catch (error) {
    console.error(`Failed to generate thumbnail URL: ${imageUrl}`, error)
    return ''
  }
}
