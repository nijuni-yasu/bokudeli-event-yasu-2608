import { createLinkTarget, findMatchedText, formatText } from './helpers'

export default function findLinksAndReplace(el: Node) {
  if (!(el instanceof HTMLElement)) {
    return
  }
  el.innerHTML =
    el.textContent
      ?.split(' ')
      ?.map((baseText) => {
        const matchedTexts = findMatchedText(baseText) || []

        if (matchedTexts.length) {
          const options = createLinkTarget()

          matchedTexts.forEach((matchedText) => {
            baseText = formatText(baseText, matchedText, options)
          })
        }
        return baseText
      })
      .join(' ') ?? ''
}
