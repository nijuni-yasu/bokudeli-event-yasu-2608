import { describe, expect, it } from 'vitest'
import { buildLinkifiedSegments } from './linkifiedSegments.js'

const textValues = (segments: ReturnType<typeof buildLinkifiedSegments>): string[] =>
  segments.flatMap((segment) => (segment.kind === 'text' ? [segment.value] : []))

describe('buildLinkifiedSegments', () => {
  it('keeps HTML tags as plain text', () => {
    const segments = buildLinkifiedSegments('<b>太字</b>')
    expect(segments).toEqual([{ kind: 'text', value: '<b>太字</b>' }])
  })

  it('keeps script tags as plain text', () => {
    const segments = buildLinkifiedSegments('<script>alert(1)</script>')
    expect(segments).toEqual([{ kind: 'text', value: '<script>alert(1)</script>' }])
  })

  it('keeps img onerror payload as plain text segments', () => {
    const segments = buildLinkifiedSegments('<img src=x onerror=alert(1)>')
    expect(segments.every((segment) => segment.kind === 'text')).toBe(true)
    expect(segments.flatMap((segment) => (segment.kind === 'text' ? [segment.value] : [])).join('')).toBe(
      '<img src=x onerror=alert(1)>',
    )
  })

  it('linkifies a standalone URL token', () => {
    const segments = buildLinkifiedSegments('https://example.com')
    expect(segments).toEqual([
      {
        kind: 'url',
        href: 'https://example.com',
        label: 'https://example.com',
      },
    ])
  })

  it('linkifies an email token', () => {
    const segments = buildLinkifiedSegments('foo@example.com')
    expect(segments).toEqual([
      {
        kind: 'email',
        href: 'mailto:foo@example.com',
        label: 'foo@example.com',
      },
    ])
  })

  it('linkifies URL within a space-delimited sentence token', () => {
    const segments = buildLinkifiedSegments('see https://a.com ok')
    expect(segments).toEqual([
      { kind: 'text', value: 'see' },
      { kind: 'text', value: ' ' },
      {
        kind: 'url',
        href: 'https://a.com',
        label: 'https://a.com',
      },
      { kind: 'text', value: ' ' },
      { kind: 'text', value: 'ok' },
    ])
  })

  it('preserves HTML token and linkifies the next token', () => {
    const segments = buildLinkifiedSegments('<b>太字</b> https://example.com')
    expect(textValues(segments)).toEqual(['<b>太字</b>', ' '])
    expect(segments[segments.length - 1]).toEqual({
      kind: 'url',
      href: 'https://example.com',
      label: 'https://example.com',
    })
  })

  it('returns empty array for empty input', () => {
    expect(buildLinkifiedSegments('')).toEqual([])
  })
})
