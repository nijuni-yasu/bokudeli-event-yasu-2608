const PENDING_TOAST_KEY = 'pendingToast'

export type PendingToast = {
  message: string
  color: string
}

/** OAuth redirect 復帰後（フルリロード）に toast を表示するため sessionStorage に保存する */
export function setPendingToast(message: string, color: string): void {
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, color }))
}

export function consumePendingToast(): PendingToast | null {
  const raw = sessionStorage.getItem(PENDING_TOAST_KEY)
  if (raw == null) {
    return null
  }
  sessionStorage.removeItem(PENDING_TOAST_KEY)
  return JSON.parse(raw) as PendingToast
}
