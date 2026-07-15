import { LINK_TARGET } from './constants.js'
import { buildLinkifiedSegments } from './linkifiedSegments.js'

export const renderLinkifiedContent = (el: HTMLElement, plainText: string): void => {
  el.replaceChildren()

  for (const segment of buildLinkifiedSegments(plainText)) {
    if (segment.kind === 'text') {
      el.appendChild(document.createTextNode(segment.value))
      continue
    }

    const anchor = document.createElement('a')
    anchor.href = segment.href
    anchor.target = LINK_TARGET.DEFAULT
    anchor.rel = 'noopener noreferrer'
    anchor.textContent = segment.label
    el.appendChild(anchor)
  }
}
