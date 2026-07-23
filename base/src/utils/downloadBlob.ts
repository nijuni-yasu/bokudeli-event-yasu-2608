export type DownloadBlobResult = 'downloaded' | 'shared'

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

const shareViaWebShare = async (blob: Blob, fileName: string): Promise<boolean> => {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }
  const file = new File([blob], fileName, { type: blob.type !== '' ? blob.type : 'application/octet-stream' })
  if (!navigator.canShare({ files: [file] })) {
    return false
  }
  await navigator.share({ files: [file] })
  return true
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
      // share 失敗時は anchor ダウンロードへフォールバック
    }
  }

  downloadViaAnchor(blob, safeName)
  return 'downloaded'
}
