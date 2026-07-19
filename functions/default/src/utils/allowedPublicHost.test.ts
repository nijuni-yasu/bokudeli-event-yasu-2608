import { describe, expect, it } from 'vitest'

import {
  isAllowedPublicHostname,
  isAllowedRequestHostname,
  isBlockedPublicHostname,
  parseRequestHostname,
} from './allowedPublicHost.js'

describe('allowedPublicHost', () => {
  it('parseRequestHostname strips port and lowercases', () => {
    expect(parseRequestHostname('Shokujii.JP:443')).toBe('shokujii.jp')
    expect(parseRequestHostname('sandbox.firebaseapp.com')).toBe('sandbox.firebaseapp.com')
  })

  it('isBlockedPublicHostname rejects localhost and IP literals', () => {
    expect(isBlockedPublicHostname('localhost')).toBe(true)
    expect(isBlockedPublicHostname('127.0.0.1')).toBe(true)
    expect(isBlockedPublicHostname('169.254.169.254')).toBe(true)
    expect(isBlockedPublicHostname('10.0.0.1')).toBe(true)
    expect(isBlockedPublicHostname('::1')).toBe(true)
  })

  it('isAllowedPublicHostname allows configured EVENT_HOST and known domains', () => {
    expect(isAllowedPublicHostname('shokujii.jp', 'shokujii.jp')).toBe(true)
    expect(isAllowedPublicHostname('www.shokujii.jp', 'shokujii.jp')).toBe(true)
    expect(isAllowedPublicHostname('bokudeli-event-yasu-2605.firebaseapp.com', 'shokujii.jp')).toBe(true)
    expect(isAllowedPublicHostname('example.web.app', '')).toBe(true)
  })

  it('isAllowedPublicHostname rejects unknown hosts', () => {
    expect(isAllowedPublicHostname('evil.com', 'shokujii.jp')).toBe(false)
  })

  it('isAllowedRequestHostname combines blocklist and allowlist', () => {
    expect(isAllowedRequestHostname('shokujii.jp', 'shokujii.jp')).toBe(true)
    expect(isAllowedRequestHostname('evil.com', 'shokujii.jp')).toBe(false)
    expect(isAllowedRequestHostname('127.0.0.1', 'shokujii.jp')).toBe(false)
  })
})
