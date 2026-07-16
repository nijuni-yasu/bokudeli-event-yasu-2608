import { describe, expect, it, vi } from 'vitest'
import type { ProviderIdType } from '@shokujii/base/utils/providerService'

const { mockClearStale } = vi.hoisted(() => ({
  mockClearStale: vi.fn(),
}))

vi.mock('@shokujii/base/utils/redirect', () => ({
  isProviderIdType: (value: unknown): value is ProviderIdType =>
    value === 'google.com' || value === 'facebook.com' || value === 'twitter.com',
  clearStalePendingLinkRequestOutsideAutoLinkage: mockClearStale,
}))

import {
  getLinkRequestDialogParams,
  parseLoginQueryPids,
  runLoginPageMountAutoLinkage,
} from '@/utils/loginAutoLinkage.js'

describe('loginAutoLinkage', () => {
  describe('parseLoginQueryPids', () => {
    it('string の pid のみ取り込む', () => {
      expect(parseLoginQueryPids('google.com', 'facebook.com')).toEqual({
        pid1: 'google.com',
        pid2: 'facebook.com',
      })
      expect(parseLoginQueryPids(undefined, ['facebook.com'])).toEqual({
        pid1: null,
        pid2: null,
      })
    })
  })

  describe('getLinkRequestDialogParams', () => {
    it('有効な pid1/pid2 のとき dialog 用 params を返す', () => {
      expect(
        getLinkRequestDialogParams({
          pid1: 'google.com',
          pid2: 'facebook.com',
        }),
      ).toEqual({
        tryLoginProviderId: 'google.com',
        linkProviderId: 'facebook.com',
      })
    })

    it('pid 欠落・無効のとき null', () => {
      expect(getLinkRequestDialogParams({ pid1: null, pid2: 'facebook.com' })).toBeNull()
      expect(getLinkRequestDialogParams({ pid1: 'invalid', pid2: 'facebook.com' })).toBeNull()
    })
  })

  describe('runLoginPageMountAutoLinkage', () => {
    it('pid なしでも clearStale を呼ぶ', () => {
      mockClearStale.mockClear()
      expect(runLoginPageMountAutoLinkage(undefined, undefined)).toBeNull()
      expect(mockClearStale).toHaveBeenCalledOnce()
      expect(mockClearStale).toHaveBeenCalledWith({
        loginPid1: null,
        loginPid2: null,
      })
    })

    it('有効な pid1/pid2（自動連携通知あり）でも clearStale を先に呼ぶ（RC-29）', () => {
      mockClearStale.mockClear()
      const params = runLoginPageMountAutoLinkage('google.com', 'facebook.com')
      expect(params).toEqual({
        tryLoginProviderId: 'google.com',
        linkProviderId: 'facebook.com',
      })
      expect(mockClearStale).toHaveBeenCalledOnce()
      expect(mockClearStale).toHaveBeenCalledWith({
        loginPid1: 'google.com',
        loginPid2: 'facebook.com',
      })
    })
  })
})
