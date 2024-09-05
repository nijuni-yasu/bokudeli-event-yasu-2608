import { LINK_TARGET, REGEX_PATTERN } from './constants.js'

export function findMatchedText(text = '') {
  return [...text.matchAll(REGEX_PATTERN.EMAIL_ADDRESS), ...text.matchAll(REGEX_PATTERN.URL)].flat()
}

export function formatText(baseText: string, matchedText: string, options: string) {
  if (matchedText.match(REGEX_PATTERN.EMAIL_ADDRESS) !== null) {
    baseText = _formatEmailText(baseText, matchedText, options)
  }
  if (matchedText.match(REGEX_PATTERN.URL) !== null) {
    baseText = _formatUrlText(baseText, matchedText, options)
  }
  return baseText
}

export function createLinkTarget(target: string | null = null) {
  return `target="${target || LINK_TARGET.DEFAULT}"`
}

function _formatEmailText(baseText: string, matchedText: string, options: string) {
  return baseText.replace(matchedText, `<a ${options} href="mailto:${matchedText}">${matchedText}</a>`)
}

function _formatUrlText(baseText: string, matchedText: string, options: string) {
  const prefix =
    matchedText.toLowerCase().indexOf('http') === -1 && matchedText.toLowerCase().indexOf('ftp') === -1 ? '//' : ''
  return baseText.replace(matchedText, `<a ${options} href="${prefix + matchedText.trim()}">${matchedText}</a>`)
}
