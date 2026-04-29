export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/apng', 'image/gif', 'image/webp'] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const ALLOWED_IMAGE_ACCEPT_ATTR = ALLOWED_IMAGE_MIME_TYPES.join(', ')

export function isAllowedImageMimeType(mimeType: string | undefined | null): mimeType is AllowedImageMimeType {
  if (mimeType == null || mimeType === '') return false
  return ALLOWED_IMAGE_MIME_TYPES.some((m) => m === mimeType)
}
