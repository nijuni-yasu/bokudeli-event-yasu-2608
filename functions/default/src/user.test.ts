import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getUserIdFromEmailMock,
  savePassCodeMock,
  getValidPassCodeFromEmailMock,
  deletePassCodeMock,
  sendMock,
  createUserMock,
  createCustomTokenMock,
  saveUserMock,
} = vi.hoisted(() => ({
  getUserIdFromEmailMock: vi.fn(),
  savePassCodeMock: vi.fn(),
  getValidPassCodeFromEmailMock: vi.fn(),
  deletePassCodeMock: vi.fn(),
  sendMock: vi.fn(),
  createUserMock: vi.fn(),
  createCustomTokenMock: vi.fn(),
  saveUserMock: vi.fn(),
}))

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: (...args: unknown[]) => (args.length === 2 ? args[1] : args[0]),
}))

vi.mock('firebase-admin/auth', () => {
  class FirebaseAuthError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  }
  return {
    FirebaseAuthError,
    getAuth: () => ({
      createUser: createUserMock,
      createCustomToken: createCustomTokenMock,
    }),
  }
})

vi.mock('./stores/user.js', () => ({
  getUserIdFromEmail: (...args: unknown[]) => getUserIdFromEmailMock(...args),
  saveUser: (...args: unknown[]) => saveUserMock(...args),
  ShokujiiUser: class ShokujiiUser {
    id: string
    user_email: string
    constructor(id: string, src: { user_email: string }) {
      this.id = id
      this.user_email = src.user_email
    }
  },
}))

vi.mock('./stores/passCode.js', () => ({
  savePassCode: (...args: unknown[]) => savePassCodeMock(...args),
  getValidPassCodeFromEmail: (...args: unknown[]) => getValidPassCodeFromEmailMock(...args),
  deletePassCode: (...args: unknown[]) => deletePassCodeMock(...args),
  ShokujiiPassCode: class ShokujiiPassCode {
    pass_code = '123456'
  },
}))

vi.mock('./utils/sendgrid.js', () => ({
  send: (...args: unknown[]) => sendMock(...args),
}))

vi.mock('./utils/mail.js', () => ({
  DEFAULT_FROM: 'test@example.com',
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { FirebaseAuthError } from 'firebase-admin/auth'
import { confirmEmailLogin, confirmEmailRegistration, requestEmailLogin, requestEmailRegistration } from './user.js'

type CallableHandler<T> = (req: { data: T }) => Promise<unknown>

const callRequestEmailLogin = (email: string) =>
  (requestEmailLogin as unknown as CallableHandler<{ email: string }>)({ data: { email } })

const callRequestEmailRegistration = (email: string) =>
  (requestEmailRegistration as unknown as CallableHandler<{ email: string }>)({ data: { email } })

const callConfirmEmailLogin = (email: string, passCode: string) =>
  (confirmEmailLogin as unknown as CallableHandler<{ email: string; passCode: string }>)({
    data: { email, passCode },
  })

const callConfirmEmailRegistration = (email: string, passCode: string) =>
  (confirmEmailRegistration as unknown as CallableHandler<{ email: string; passCode: string }>)({
    data: { email, passCode },
  })

describe('requestEmailLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    savePassCodeMock.mockResolvedValue(undefined)
    sendMock.mockResolvedValue(undefined)
  })

  it('未登録メールでは not-found を返す', async () => {
    getUserIdFromEmailMock.mockResolvedValue(undefined)

    await expect(callRequestEmailLogin('new@example.com')).rejects.toMatchObject({
      code: 'not-found',
    })
    expect(savePassCodeMock).not.toHaveBeenCalled()
  })

  it('登録済みメールでは OTP を送信する', async () => {
    getUserIdFromEmailMock.mockResolvedValue('uid-existing')

    const result = await callRequestEmailLogin('existing@example.com')

    expect(result).toEqual({ success: true })
    expect(savePassCodeMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledOnce()
  })
})

describe('requestEmailRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    savePassCodeMock.mockResolvedValue(undefined)
    sendMock.mockResolvedValue(undefined)
  })

  it('登録済みメールでは already-exists を返す', async () => {
    getUserIdFromEmailMock.mockResolvedValue('uid-existing')

    await expect(callRequestEmailRegistration('existing@example.com')).rejects.toMatchObject({
      code: 'already-exists',
    })
    expect(savePassCodeMock).not.toHaveBeenCalled()
  })

  it('未登録メールでは OTP を送信する', async () => {
    getUserIdFromEmailMock.mockResolvedValue(undefined)

    const result = await callRequestEmailRegistration('new@example.com')

    expect(result).toEqual({ success: true })
    expect(savePassCodeMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledOnce()
  })
})

describe('confirmEmailLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deletePassCodeMock.mockResolvedValue(undefined)
    createCustomTokenMock.mockResolvedValue('custom-token')
  })

  it('user_id が null の passCode は拒否する', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })

    await expect(callConfirmEmailLogin('new@example.com', '123456')).rejects.toMatchObject({
      code: 'invalid-argument',
    })
    expect(createCustomTokenMock).not.toHaveBeenCalled()
  })

  it('登録済みユーザーの passCode で custom token を返す', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: 'uid-existing',
    })

    const result = await callConfirmEmailLogin('existing@example.com', '123456')

    expect(result).toEqual({ token: 'custom-token' })
    expect(createCustomTokenMock).toHaveBeenCalledWith('uid-existing')
  })
})

describe('confirmEmailRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deletePassCodeMock.mockResolvedValue(undefined)
    createUserMock.mockResolvedValue({ uid: 'uid-new' })
    createCustomTokenMock.mockResolvedValue('custom-token')
    saveUserMock.mockResolvedValue(undefined)
  })

  it('user_id 付き passCode は拒否する', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: 'uid-existing',
    })

    await expect(callConfirmEmailRegistration('existing@example.com', '123456')).rejects.toMatchObject({
      code: 'invalid-argument',
    })
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('新規登録 passCode で createUser し token を返す', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })

    const result = await callConfirmEmailRegistration('new@example.com', '123456')

    expect(result).toEqual({ token: 'custom-token' })
    expect(createUserMock).toHaveBeenCalledWith({ email: 'new@example.com', emailVerified: true })
    expect(saveUserMock).toHaveBeenCalledOnce()
    expect(deletePassCodeMock).toHaveBeenCalledWith('pc-1')
  })

  it('saveUser 失敗時は pass code を削除しない', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })
    saveUserMock.mockRejectedValue(new Error('save failed'))

    await expect(callConfirmEmailRegistration('new@example.com', '123456')).rejects.toThrow('save failed')

    expect(createUserMock).toHaveBeenCalledOnce()
    expect(createCustomTokenMock).toHaveBeenCalledOnce()
    expect(deletePassCodeMock).not.toHaveBeenCalled()
  })

  it('Auth に既存メールがある場合は already-exists を返す', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })
    createUserMock.mockRejectedValue(new FirebaseAuthError('auth/email-already-exists', 'email already exists'))

    await expect(callConfirmEmailRegistration('existing@example.com', '123456')).rejects.toMatchObject({
      code: 'already-exists',
    })
    expect(createCustomTokenMock).not.toHaveBeenCalled()
    expect(saveUserMock).not.toHaveBeenCalled()
  })
})
