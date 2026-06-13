type PendingToast = {
  message: string
  color: string
}

let pendingToast: PendingToast | null = null

export function setPendingToast(message: string, color: string): void {
  pendingToast = { message, color }
}

export function consumePendingToast(): PendingToast | null {
  const toast = pendingToast
  pendingToast = null
  return toast
}
