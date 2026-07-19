import { describe, expect, it } from 'vitest'
import { isLoginRequired, isPublicRoute } from './authGuards.js'

describe('authGuards', () => {
  describe('isPublicRoute', () => {
    it('allows login flow and maintenance paths without auth', () => {
      expect(isPublicRoute('/login')).toBe(true)
      expect(isPublicRoute('/pass-code')).toBe(true)
      expect(isPublicRoute('/maintenance')).toBe(true)
      expect(isPublicRoute('/404')).toBe(true)
      expect(isPublicRoute('/520')).toBe(true)
    })

    it('requires auth for app routes', () => {
      expect(isPublicRoute('/')).toBe(false)
      expect(isPublicRoute('/u/abc')).toBe(false)
      expect(isPublicRoute('/c/foo')).toBe(false)
      expect(isPublicRoute('/c/foo/e/bar')).toBe(false)
      expect(isPublicRoute('/cart')).toBe(false)
      expect(isPublicRoute('/mypage')).toBe(false)
      expect(isPublicRoute('/admin')).toBe(false)
      expect(isPublicRoute('/manage')).toBe(false)
    })
  })

  describe('isLoginRequired', () => {
    it('is the inverse of isPublicRoute', () => {
      expect(isLoginRequired('/login')).toBe(false)
      expect(isLoginRequired('/c/foo/e/bar')).toBe(true)
      expect(isLoginRequired('/u/abc')).toBe(true)
    })
  })
})
