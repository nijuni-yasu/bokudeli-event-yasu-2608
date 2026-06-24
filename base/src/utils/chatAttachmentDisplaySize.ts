export const CHAT_ATTACHMENT_DISPLAY_MAX_PX = 240

export const computeChatAttachmentDisplaySize = (
  width: number,
  height: number,
  maxPx = CHAT_ATTACHMENT_DISPLAY_MAX_PX,
): { width: number; height: number } => {
  if (width <= maxPx && height <= maxPx) {
    return { width, height }
  }
  const scale = Math.min(maxPx / width, maxPx / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
