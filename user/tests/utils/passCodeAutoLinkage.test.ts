import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  evaluatePendingLinkPreconditions,
  parsePassCodeLinkProviderId,
  runPassCodeMountAutoLinkageSetup,
  runPassCodePostOtpLinkPreCheck,
  shouldAutoSendOtpOnPassCodeMount,
  shouldClearStalePendingOnPassCodeMount,
} from '@/utils/passCodeAutoLinkage.js'

describe('passCodeAutoLinkage', () => {
  beforeEach(() => {
    mockClearStale.mockClear()
  })

  describe('parsePassCodeLinkProviderId', () => {
    it('有効な pid のみ ProviderIdType を返す', () => {
      expect(parsePassCodeLinkProviderId('facebook.com')).toBe('facebook.com')
      expect(parsePassCodeLinkProviderId('invalid')).toBeNull()
      expect(parsePassCodeLinkProviderId(undefined)).toBeNull()
    })
  })

  describe('shouldClearStalePendingOnPassCodeMount', () => {
    it('login かつ未ログインのとき true', () => {
      expect(shouldClearStalePendingOnPassCodeMount({ mode: 'login', isLogin: false })).toBe(true)
      expect(shouldClearStalePendingOnPassCodeMount({ mode: 'register', isLogin: false })).toBe(false)
      expect(shouldClearStalePendingOnPassCodeMount({ mode: 'login', isLogin: true })).toBe(false)
    })
  })

  describe('shouldAutoSendOtpOnPassCodeMount', () => {
    it('login・未ログイン・有効 pid のとき true', () => {
      expect(
        shouldAutoSendOtpOnPassCodeMount({
          mode: 'login',
          isLogin: false,
          linkProviderId: 'google.com',
        }),
      ).toBe(true)
      expect(
        shouldAutoSendOtpOnPassCodeMount({
          mode: 'login',
          isLogin: false,
          linkProviderId: null,
        }),
      ).toBe(false)
    })
  })

  describe('runPassCodeMountAutoLinkageSetup', () => {
    it('login 自動連携 mount では clearStale を呼び OTP 送信要', () => {
      const result = runPassCodeMountAutoLinkageSetup({
        mode: 'login',
        isLogin: false,
        passCodePid: 'google.com',
      })
      expect(result.shouldAutoSendOtp).toBe(true)
      expect(mockClearStale).toHaveBeenCalledOnce()
      expect(mockClearStale).toHaveBeenCalledWith({ passCodePid: 'google.com' })
    })

    it('register では clearStale も OTP 送信も不要', () => {
      const result = runPassCodeMountAutoLinkageSetup({
        mode: 'register',
        isLogin: false,
        passCodePid: 'google.com',
      })
      expect(result.shouldAutoSendOtp).toBe(false)
      expect(mockClearStale).not.toHaveBeenCalled()
    })

    it('pid なし login mount でも clearStale を呼ぶ', () => {
      const result = runPassCodeMountAutoLinkageSetup({
        mode: 'login',
        isLogin: false,
        passCodePid: null,
      })
      expect(result.shouldAutoSendOtp).toBe(false)
      expect(mockClearStale).toHaveBeenCalledOnce()
      expect(mockClearStale).toHaveBeenCalledWith({ passCodePid: null })
    })
  })

  describe('evaluatePendingLinkPreconditions', () => {
    it('linkProviderId・pending 一致・ログイン済みなら proceed', () => {
      expect(evaluatePendingLinkPreconditions('google.com', 'google.com', true)).toBe('proceed')
    })

    it('pending 不一致・未ログイン・pid なしは skipped', () => {
      expect(evaluatePendingLinkPreconditions('google.com', 'facebook.com', true)).toBe('skipped')
      expect(evaluatePendingLinkPreconditions('google.com', null, true)).toBe('skipped')
      expect(evaluatePendingLinkPreconditions(null, 'google.com', true)).toBe('skipped')
      expect(evaluatePendingLinkPreconditions('google.com', 'google.com', false)).toBe('skipped')
    })
  })

  describe('runPassCodePostOtpLinkPreCheck', () => {
    it('OTP 後連携前に clearStale を呼び proceed を返す', () => {
      expect(runPassCodePostOtpLinkPreCheck('google.com', 'google.com', true)).toEqual({
        outcome: 'proceed',
        linkProviderId: 'google.com',
      })
      expect(mockClearStale).toHaveBeenCalledOnce()
      expect(mockClearStale).toHaveBeenCalledWith({ passCodePid: 'google.com' })
    })

    it('pending 不一致のとき skipped（clearStale は呼ぶ）', () => {
      expect(runPassCodePostOtpLinkPreCheck('google.com', 'facebook.com', true)).toEqual({ outcome: 'skipped' })
      expect(mockClearStale).toHaveBeenCalledOnce()
    })
  })
})
