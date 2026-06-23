import { getI18n } from '@shokujii/base/plugins/i18n/index.js'
import { isChunkLoadError } from '@shokujii/base/utils/isChunkLoadError.js'

export const STALE_CHUNK_RELOAD_SESSION_KEY = 'shokujii-chunk-reload'
const RELOAD_DELAY_MS = 500
const TOAST_ELEMENT_ID = 'shokujii-stale-chunk-toast'
const FALLBACK_MESSAGE = '更新を反映しています…'

export function clearStaleChunkReloadFlag(): void {
  sessionStorage.removeItem(STALE_CHUNK_RELOAD_SESSION_KEY)
}

function getReloadMessage(): string {
  try {
    return getI18n().global.t('error.app_update_reload')
  } catch {
    return FALLBACK_MESSAGE
  }
}

function showStaleChunkReloadToast(): void {
  if (document.getElementById(TOAST_ELEMENT_ID) != null) {
    return
  }

  const toast = document.createElement('div')
  toast.id = TOAST_ELEMENT_ID
  toast.textContent = getReloadMessage()
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  Object.assign(toast.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '99999',
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: '#323232',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: '1.4',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    maxWidth: 'calc(100vw - 32px)',
    textAlign: 'center',
  })
  document.body?.appendChild(toast)
}

export function isStaleChunkRetryExhausted(err: unknown): boolean {
  return isChunkLoadError(err) && sessionStorage.getItem(STALE_CHUNK_RELOAD_SESSION_KEY) != null
}

export function tryReloadForStaleChunk(err: unknown): boolean {
  if (!isChunkLoadError(err)) {
    return false
  }

  if (sessionStorage.getItem(STALE_CHUNK_RELOAD_SESSION_KEY) != null) {
    return false
  }

  sessionStorage.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, '1')
  showStaleChunkReloadToast()
  window.setTimeout(() => {
    window.location.reload()
  }, RELOAD_DELAY_MS)

  return true
}
