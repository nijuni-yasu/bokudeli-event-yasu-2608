import { describe, expect, it } from 'vitest'
import { resolveRequestSite } from './resolveRequestSite.js'

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
})
