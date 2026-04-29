import { isAllowedImageMimeType } from '@shokujii/common/constants/imageMimeTypes.js'

export type ImageValidationResult = { ok: true } | { ok: false; messageKey: 'image.invalid_format' }

/**
 * アップロード対象の画像ファイルが許可された MIME タイプか検証する。
 * 仕様: documents/02_主催者獲得と継続/16_画像の拡張子.md
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!isAllowedImageMimeType(file.type)) {
    return { ok: false, messageKey: 'image.invalid_format' }
  }
  return { ok: true }
}

export const resizeImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let { width, height } = img

      if (Math.max(width, height) > maxSize) {
        if (width > maxSize) {
          height *= maxSize / width
          width = maxSize
        } else {
          width *= maxSize / height
          height = maxSize
        }
      }
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name))
        } else {
          reject(new Error('リサイズに失敗しました'))
        }
      })
    }
    reader.readAsDataURL(file)
  })
}
