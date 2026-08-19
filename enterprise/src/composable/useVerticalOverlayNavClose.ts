export type VerticalOverlayNavToggleFn = (value: boolean) => void

let toggleVerticalOverlayNavActive: VerticalOverlayNavToggleFn | null = null

export function registerVerticalOverlayNavClose(toggle: VerticalOverlayNavToggleFn | null): void {
  toggleVerticalOverlayNavActive = toggle
}

/**
 * 自分が登録した toggle のみ解除する。
 * レイアウト切替時は新インスタンスの mount が旧インスタンスの unmount より先に走るため、
 * 無条件に null を書くと有効な登録を消してしまう。
 */
export function unregisterVerticalOverlayNavClose(toggle: VerticalOverlayNavToggleFn): void {
  if (toggleVerticalOverlayNavActive === toggle) {
    toggleVerticalOverlayNavActive = null
  }
}

export function closeVerticalOverlayNav(): void {
  toggleVerticalOverlayNavActive?.(false)
}
