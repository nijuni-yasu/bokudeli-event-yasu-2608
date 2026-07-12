const PENDING_TOAST_KEY = 'pendingToast'

export type PendingToast = {
  message: string
  color: string
}

/** OAuth redirect 復帰後（フルリロード）に toast を表示するため sessionStorage に保存する */
export function setPendingToast(message: string, color: string): void {
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, color }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function isPendingToast(value: unknown): value is PendingToast {
  if (!isRecord(value)) {
    return false
  }
  const message = readString(value, 'message')
  const color = readString(value, 'color')
  return message !== undefined && color !== undefined
}

function parsePendingToast(raw: string): PendingToast | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isPendingToast(parsed)) {
      return null
    }
    return { message: parsed.message, color: parsed.color }
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
