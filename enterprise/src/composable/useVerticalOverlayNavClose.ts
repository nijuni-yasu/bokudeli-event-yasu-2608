let toggleVerticalOverlayNavActive: ((value: boolean) => void) | null = null

export function registerVerticalOverlayNavClose(toggle: ((value: boolean) => void) | null): void {
  toggleVerticalOverlayNavActive = toggle
}

export function closeVerticalOverlayNav(): void {
  toggleVerticalOverlayNavActive?.(false)
}
