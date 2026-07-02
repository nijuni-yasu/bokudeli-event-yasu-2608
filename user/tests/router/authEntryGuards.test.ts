import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserCredential } from 'firebase/auth'

const { mockDelete, mockGetAuth, mockSignOut } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockGetAuth: vi.fn(() => ({ uid: 'auth-instance' })),
  mockSignOut: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  signOut: mockSignOut,
}))

import { rejectExistingUserOnRegister, rejectNewUserOnLogin, signOutBestEffort } from '@/router/authEntryGuards.js'

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
})
