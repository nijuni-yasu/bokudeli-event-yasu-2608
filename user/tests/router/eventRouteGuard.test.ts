import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { isPublicEventDetailPath, resolveEventLoadFailureRedirect } from '@/router/eventRouteGuard.js'

describe('isPublicEventDetailPath', () => {
  it('公開イベント詳細パスを true とする', () => {
    expect(isPublicEventDetailPath('/c/flc_fes/e/abc123')).toBe(true)
    expect(isPublicEventDetailPath('/c/flc_fes/e/abc123/members')).toBe(true)
  })

  it('管理画面・その他パスを false とする', () => {
    expect(isPublicEventDetailPath('/manage/event/abc123')).toBe(false)
    expect(isPublicEventDetailPath('/c/flc_fes')).toBe(false)
  })
})

describe('resolveEventLoadFailureRedirect', () => {
  it('ZodError は /520', () => {
    const err = new ZodError([])
    expect(resolveEventLoadFailureRedirect('/c/foo/e/bar', err)).toBe('/520')
    expect(resolveEventLoadFailureRedirect('/manage/event/bar', err)).toBe('/520')
  })

  it('公開イベント詳細の Firestore 失敗はリダイレクトしない', () => {
    expect(resolveEventLoadFailureRedirect('/c/foo/e/bar', new Error('timeout'))).toBeUndefined()
  })

  it('管理画面イベントの Firestore 失敗は /404', () => {
    expect(resolveEventLoadFailureRedirect('/manage/event/bar', new Error('timeout'))).toBe('/404')
  })
})
