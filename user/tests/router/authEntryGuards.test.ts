import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FirebaseError } from 'firebase/app'
import type { UserCredential } from 'firebase/auth'

const { mockDelete, mockGetAuth, mockSignOut, mockGetAdditionalUserInfo, mockGetI18n } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockGetAuth: vi.fn(() => ({ uid: 'auth-instance' })),
  mockSignOut: vi.fn(),
  mockGetAdditionalUserInfo: vi.fn(),
  mockGetI18n: vi.fn(() => ({
    global: {
      t: (key: string) => key,
    },
  })),
}))

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  signOut: mockSignOut,
  getAdditionalUserInfo: mockGetAdditionalUserInfo,
}))

vi.mock('@shokujii/base/plugins/i18n/index.js', () => ({
  getI18n: mockGetI18n,
}))

import {
  handleProfileUpdateFailure,
  rejectExistingUserOnRegister,
  rejectNewUserOnLogin,
  signOutBestEffort,
} from '@/router/authEntryGuards.js'

const createUserCredential = (): UserCredential =>
  ({
    providerId: 'google.com',
    user: { delete: mockDelete },
  }) as unknown as UserCredential

describe('authEntryGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDelete.mockResolvedValue(undefined)
    mockSignOut.mockResolvedValue(undefined)
  })

  describe('rejectNewUserOnLogin', () => {
    it('deletes the user and signs out when delete succeeds', async () => {
      const userCredential = createUserCredential()

      await rejectNewUserOnLogin(userCredential)

      expect(mockDelete).toHaveBeenCalledOnce()
      expect(mockSignOut).toHaveBeenCalledWith({ uid: 'auth-instance' })
    })

    it('throws without signing out when delete fails', async () => {
      const deleteError = new Error('delete failed')
      mockDelete.mockRejectedValue(deleteError)
      const userCredential = createUserCredential()

      await expect(rejectNewUserOnLogin(userCredential)).rejects.toThrow('delete failed')

      expect(mockSignOut).not.toHaveBeenCalled()
    })
  })

  describe('rejectExistingUserOnRegister', () => {
    it('signs out without deleting the user', async () => {
      await rejectExistingUserOnRegister()

      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalledWith({ uid: 'auth-instance' })
    })
  })

  describe('signOutBestEffort', () => {
    it('signs out when signOut succeeds', async () => {
      await signOutBestEffort()

      expect(mockSignOut).toHaveBeenCalledWith({ uid: 'auth-instance' })
    })

    it('does not throw when signOut fails', async () => {
      mockSignOut.mockRejectedValue(new Error('signOut failed'))

      await expect(signOutBestEffort()).resolves.toBeUndefined()
    })
  })

  describe('handleProfileUpdateFailure', () => {
    beforeEach(() => {
      vi.stubGlobal('window', { alert: vi.fn() })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('/register かつ isNewUser なら delete して /register へ戻す', async () => {
      mockGetAdditionalUserInfo.mockReturnValue({ isNewUser: true })
      const userCredential = createUserCredential()

      const result = await handleProfileUpdateFailure('/register', {}, userCredential, new Error('failed'))

      expect(mockDelete).toHaveBeenCalledOnce()
      expect(result).toEqual({ path: '/register', query: {} })
    })

    it('already-exists なら /login へリダイレクトする', async () => {
      mockGetAdditionalUserInfo.mockReturnValue({ isNewUser: true })
      const userCredential = createUserCredential()
      const error = new FirebaseError('functions/already-exists', 'already exists')

      const result = await handleProfileUpdateFailure('/register', { redirect: '1' }, userCredential, error)

      expect(result).toEqual({ path: '/login', query: { redirect: '1' } })
    })

    it('/login 導線では signOut のみ行い /login へ戻す', async () => {
      const result = await handleProfileUpdateFailure('/login', {}, null, new Error('failed'))

      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalledOnce()
      expect(result).toEqual({ path: '/login', query: {} })
    })

    it('cleanup 失敗時は signOut して false を返す', async () => {
      mockGetAdditionalUserInfo.mockReturnValue({ isNewUser: true })
      mockDelete.mockRejectedValue(new Error('delete failed'))
      const userCredential = createUserCredential()

      const result = await handleProfileUpdateFailure('/register', {}, userCredential, new Error('failed'))

      expect(mockSignOut).toHaveBeenCalledOnce()
      expect(result).toBe(false)
    })

    it('/profile 失敗時は signOut せず undefined を返す', async () => {
      const userCredential = createUserCredential()

      const result = await handleProfileUpdateFailure('/profile', {}, userCredential, new Error('failed'))

      expect(mockSignOut).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('/profile かつ already-exists でも /login へリダイレクトしない', async () => {
      const userCredential = createUserCredential()
      const error = new FirebaseError('functions/already-exists', 'already exists')

      const result = await handleProfileUpdateFailure('/profile', { redirect: '1' }, userCredential, error)

      expect(mockSignOut).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })
})
