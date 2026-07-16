import { REGEX_PATTERN } from './constants.js'

export type LinkifiedSegment =
  | { kind: 'text'; value: string }
  | { kind: 'url'; href: string; label: string }
  | { kind: 'email'; href: string; label: string }

type TextMatch = {
  start: number
  end: number
  kind: 'email' | 'url'
  value: string
}

const buildUrlHref = (matchedText: string): string => matchedText.trim()

const findTokenMatches = (token: string): TextMatch[] => {
  const matches: TextMatch[] = []

  for (const match of token.matchAll(REGEX_PATTERN.EMAIL_ADDRESS)) {
    if (match.index === undefined) {
      continue
    }
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: 'email',
      value: match[0],
    })
  }

  for (const match of token.matchAll(REGEX_PATTERN.URL)) {
    if (match.index === undefined) {
      continue
    }
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: 'url',
      value: match[0],
    })
  }

  return matches.sort((a, b) => a.start - b.start)
}

const tokenToSegments = (token: string): LinkifiedSegment[] => {
  const matches = findTokenMatches(token)
  if (matches.length === 0) {
    return [{ kind: 'text', value: token }]
  }

  const segments: LinkifiedSegment[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start < cursor) {
      continue
    }
    if (match.start > cursor) {
      segments.push({ kind: 'text', value: token.slice(cursor, match.start) })
    }
    if (match.kind === 'email') {
      segments.push({
        kind: 'email',
        href: `mailto:${match.value}`,
        label: match.value,
      })
    } else {
      segments.push({
        kind: 'url',
        href: buildUrlHref(match.value),
        label: match.value,
      })
    }
    cursor = match.end
  }

  if (cursor < token.length) {
    segments.push({ kind: 'text', value: token.slice(cursor) })
  }

  return segments
}

export const buildLinkifiedSegments = (plainText: string): LinkifiedSegment[] => {
  if (plainText === '') {
    return []
  }

  const tokens = plainText.split(' ')
  const segments: LinkifiedSegment[] = []

  for (let i = 0; i < tokens.length; i++) {
    if (i > 0) {
      segments.push({ kind: 'text', value: ' ' })
    }
    segments.push(...tokenToSegments(tokens[i]))
  }

  return segments
}
