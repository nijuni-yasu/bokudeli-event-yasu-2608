const PENDING_TOAST_KEY = 'pendingToast'

export type PendingToast = {
  message: string
  color: string
}

/** OAuth redirect 復帰後（フルリロード）に toast を表示するため sessionStorage に保存する */
export function setPendingToast(message: string, color: string): void {
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, color }))
}

function isPendingToast(value: unknown): value is PendingToast {
  if (value == null || typeof value !== 'object') {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.message === 'string' && typeof record.color === 'string'
}

function parsePendingToast(raw: string): PendingToast | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPendingToast(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function consumePendingToast(): PendingToast | null {
  const raw = sessionStorage.getItem(PENDING_TOAST_KEY)
  if (raw == null) {
    return null
  }
  sessionStorage.removeItem(PENDING_TOAST_KEY)
  return parsePendingToast(raw)
}
