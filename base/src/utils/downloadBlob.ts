export type DownloadBlobResult = 'downloaded' | 'shared' | 'unavailable'

const sanitizeDownloadFileName = (fileName: string): string => {
  const trimmed = fileName.trim()
  if (trimmed === '') {
    return 'download'
  }
  const baseName = trimmed.split(/[/\\]/).pop() ?? trimmed
  return [...baseName]
    .map((char) => {
      const code = char.charCodeAt(0)
      return code <= 0x1f || code === 0x7f ? '_' : char
    })
    .join('')
}

const downloadViaAnchor = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

const blobToShareFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type !== '' ? blob.type : 'application/octet-stream' })
}

const shareFilesViaWebShare = async (files: File[]): Promise<boolean> => {
  if (files.length === 0 || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }
  if (!navigator.canShare({ files })) {
    return false
  }
  await navigator.share({ files })
  return true
}

const shareViaWebShare = async (blob: Blob, fileName: string): Promise<boolean> => {
  return shareFilesViaWebShare([blobToShareFile(blob, fileName)])
}

const isIosDevice = (): boolean => {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return true
  }
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * Blob を端末に保存する。iOS Safari 等では Web Share API にフォールバックする。
 */
export const downloadBlob = async (blob: Blob, fileName: string): Promise<DownloadBlobResult> => {
  const safeName = sanitizeDownloadFileName(fileName)

  if (isIosDevice()) {
    try {
      const shared = await shareViaWebShare(blob, safeName)
      if (shared) {
        return 'shared'
      }
    } catch {
      return 'unavailable'
    }
    return 'unavailable'
  }

  downloadViaAnchor(blob, safeName)
  return 'downloaded'
}

export type DownloadBlobItem = {
  blob: Blob
  fileName: string
}

/**
 * 複数 Blob を保存する。iOS では transient activation を1回で消費するため、可能なら1回の Web Share にまとめる。
 */
export const downloadBlobs = async (items: DownloadBlobItem[]): Promise<DownloadBlobResult> => {
  if (items.length === 0) {
    return 'downloaded'
  }
  if (items.length === 1) {
    return downloadBlob(items[0].blob, items[0].fileName)
  }

  if (isIosDevice()) {
    try {
      const files = items.map(({ blob, fileName }) => blobToShareFile(blob, sanitizeDownloadFileName(fileName)))
      const shared = await shareFilesViaWebShare(files)
      if (shared) {
        return 'shared'
      }
    } catch {
      return 'unavailable'
    }
    return 'unavailable'
  }

  for (const { blob, fileName } of items) {
    downloadViaAnchor(blob, sanitizeDownloadFileName(fileName))
  }
  return 'downloaded'
}
