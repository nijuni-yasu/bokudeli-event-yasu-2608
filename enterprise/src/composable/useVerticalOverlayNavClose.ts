export type VerticalOverlayNavToggleFn = (value: boolean) => void

let toggleVerticalOverlayNavActive: VerticalOverlayNavToggleFn | null = null

export function registerVerticalOverlayNavClose(toggle: VerticalOverlayNavToggleFn | null): void {
  toggleVerticalOverlayNavActive = toggle
}

export function closeVerticalOverlayNav(): void {
  toggleVerticalOverlayNavActive?.(false)
}
