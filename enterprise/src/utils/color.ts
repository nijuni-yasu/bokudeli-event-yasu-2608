/** hex 色を amount（0〜1）だけ暗くする */
export function darken(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex
  }
  const clampedAmount = Math.min(1, Math.max(0, amount))
  const num = parseInt(normalized, 16)
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - clampedAmount))
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - clampedAmount))
  const b = Math.max(0, (num & 0xff) * (1 - clampedAmount))
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}
