import { ref, type Ref } from 'vue'

const toggleVerticalOverlayNavActiveRef: Ref<((value: boolean) => void) | null> = ref(null)

export function registerVerticalOverlayNavClose(toggle: ((value: boolean) => void) | null): void {
  toggleVerticalOverlayNavActiveRef.value = toggle
}

export function closeVerticalOverlayNav(): void {
  toggleVerticalOverlayNavActiveRef.value?.(false)
}
