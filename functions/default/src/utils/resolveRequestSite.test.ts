import { describe, expect, it, vi } from 'vitest'
import { resolveRequestSite } from './resolveRequestSite.js'

vi.mock('./urls.js', () => ({
  getEventHost: () => 'shokujii.jp',
}))

describe('resolveRequestSite', () => {
  it('uses first host when x-forwarded-host is comma-separated', () => {
    const site = resolveRequestSite({
      protocol: 'https',
      headers: { 'x-forwarded-host': 'shokujii.jp, proxy' },
      get: () => undefined,
    } as never)
    expect(site).toBe('https://shokujii.jp')
  })

  it('returns undefined when host is missing', () => {
    const site = resolveRequestSite({
      protocol: 'https',
      headers: {},
      get: () => undefined,
    } as never)
    expect(site).toBeUndefined()
  })

  it('prefers x-forwarded-proto over req.protocol', () => {
    const site = resolveRequestSite({
      protocol: 'http',
      headers: { 'x-forwarded-proto': 'https', host: 'shokujii.jp' },
      get: (name: string) => (name === 'host' ? 'shokujii.jp' : undefined),
    } as never)
    expect(site).toBe('https://shokujii.jp')
  })

  it('uses first proto when x-forwarded-proto is comma-separated', () => {
    const site = resolveRequestSite({
      protocol: 'http',
      headers: { 'x-forwarded-proto': 'https, http', host: 'shokujii.jp' },
      get: (name: string) => (name === 'host' ? 'shokujii.jp' : undefined),
    } as never)
    expect(site).toBe('https://shokujii.jp')
  })

  it('allows firebaseapp.com suffix for sandbox hosting', () => {
    const site = resolveRequestSite({
      protocol: 'https',
      headers: { 'x-forwarded-host': 'bokudeli-event-yasu-2605.firebaseapp.com' },
      get: () => undefined,
    } as never)
    expect(site).toBe('https://bokudeli-event-yasu-2605.firebaseapp.com')
  })

  it('rejects unknown host to prevent SSRF', () => {
    const site = resolveRequestSite({
      protocol: 'https',
      headers: { 'x-forwarded-host': 'evil.com' },
      get: () => undefined,
    } as never)
    expect(site).toBeUndefined()
  })

  it('rejects IP literal host', () => {
    const site = resolveRequestSite({
      protocol: 'https',
      headers: { 'x-forwarded-host': '169.254.169.254' },
      get: () => undefined,
    } as never)
    expect(site).toBeUndefined()
  })
})
