import { describe, expect, it } from 'vitest'

import {
  DEFAULT_DOCUMENT_TITLE,
  formatDocumentTitle,
  isCommunityListPath,
  parseCommunityAccountFromPath,
  parseErrorCodeFromRoute,
  parseEventIdFromPath,
} from '@/router/documentTitleHelpers.js'
import { resolveDocumentTitle } from '@/router/documentTitle.js'
import { getI18n } from '@shokujii/base/plugins/i18n/index.js'

describe('documentTitle', () => {
  it('formatDocumentTitle matches server-side suffix format', () => {
    expect(formatDocumentTitle('Test Event')).toBe('Test Event | shokujii')
  })

  it('parseEventIdFromPath extracts event id from community event paths', () => {
    expect(parseEventIdFromPath('/c/example/e/abc123')).toBe('abc123')
    expect(parseEventIdFromPath('/c/example/e/abc123/members')).toBe('abc123')
    expect(parseEventIdFromPath('/c/example')).toBeNull()
  })

  it('parseCommunityAccountFromPath matches exact community top path only', () => {
    expect(parseCommunityAccountFromPath('/c/example')).toBe('example')
    expect(parseCommunityAccountFromPath('/c/example/e/abc123')).toBeNull()
    expect(parseCommunityAccountFromPath('/c/example/invites')).toBeNull()
  })

  it('parseErrorCodeFromRoute resolves explicit and catch-all error paths', () => {
    expect(parseErrorCodeFromRoute('/404', undefined)).toBe('404')
    expect(parseErrorCodeFromRoute('/520', undefined)).toBe('520')
    expect(parseErrorCodeFromRoute('/404', '404')).toBe('404')
    expect(parseErrorCodeFromRoute('/unknown', '404')).toBe('404')
    expect(parseErrorCodeFromRoute('/unknown', ['foo', '520'])).toBe('520')
    expect(parseErrorCodeFromRoute('/unknown', 'missing-page')).toBe('404')
    expect(parseErrorCodeFromRoute('/', undefined)).toBeNull()
    expect(parseErrorCodeFromRoute('/c/example', undefined)).toBeNull()
  })

  it('DEFAULT_DOCUMENT_TITLE matches index.html default', () => {
    expect(DEFAULT_DOCUMENT_TITLE).toBe('食事でつながる「shokujii」')
  })

  it('isCommunityListPath matches community list routes only', () => {
    expect(isCommunityListPath('/communitylist')).toBe(true)
    expect(isCommunityListPath('/communitylist/')).toBe(true)
    expect(isCommunityListPath('/c/example')).toBe(false)
  })

  it('resolveDocumentTitle returns community list title without Firestore', async () => {
    const t = getI18n().global.t as (key: string) => string
    await expect(resolveDocumentTitle({ path: '/communitylist' } as never)).resolves.toBe(
      formatDocumentTitle(t('communitylist.page_title')),
    )
  })
})
