import { renderLinkifiedContent } from './renderLinkifiedContent.js'

export default function findLinksAndReplace(el: Node, plainText?: string): void {
  if (!(el instanceof HTMLElement)) {
    return
  }
  const text = plainText ?? el.textContent ?? ''
  renderLinkifiedContent(el, text)
}
