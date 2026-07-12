import { beforeEach, describe, expect, it, vi } from 'vitest'

const GOOGLE_PHOTO_URL = 'https://lh3.googleusercontent.com/a/Example=s96-c'
const GS_PHOTO_URL = 'gs://test-project.appspot.com/users/uid-google/avatar'

const {
  getUserIdFromEmailMock,
  getUserMock,
  savePassCodeMock,
  getValidPassCodeFromEmailMock,
  deletePassCodeMock,
  sendMock,
  createUserMock,
  createCustomTokenMock,
  deleteUserMock,
  deleteNewUserDocumentsMock,
  getAuthUserMock,
  saveUserMock,
  fileSaveMock,
  isGoogleProfileImageUrlMock,
  fetchGoogleProfileImageMock,
} = vi.hoisted(() => ({
  getUserIdFromEmailMock: vi.fn(),
  getUserMock: vi.fn(),
  savePassCodeMock: vi.fn(),
  getValidPassCodeFromEmailMock: vi.fn(),
  deletePassCodeMock: vi.fn(),
  sendMock: vi.fn(),
  createUserMock: vi.fn(),
  createCustomTokenMock: vi.fn(),
  deleteUserMock: vi.fn(),
  deleteNewUserDocumentsMock: vi.fn(),
  getAuthUserMock: vi.fn(),
  saveUserMock: vi.fn(),
  fileSaveMock: vi.fn(),
  isGoogleProfileImageUrlMock: vi.fn(),
  fetchGoogleProfileImageMock: vi.fn(),
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
      deleteUser: deleteUserMock,
      getUser: getAuthUserMock,
    }),
  }
})

vi.mock('./stores/user.js', () => ({
  getUserIdFromEmail: (...args: unknown[]) => getUserIdFromEmailMock(...args),
  getUser: (...args: unknown[]) => getUserMock(...args),
  saveUser: (...args: unknown[]) => saveUserMock(...args),
  deleteNewUserDocuments: (...args: unknown[]) => deleteNewUserDocumentsMock(...args),
  ShokujiiUser: class ShokujiiUser {
    id: string
    user_email: string
    user_name: string
    user_image_url: string
    constructor(id: string, src: { user_email?: string; user_name?: string; user_image_url?: string }) {
      this.id = id
      this.user_email = src.user_email ?? ''
      this.user_name = src.user_name ?? ''
      this.user_image_url = src.user_image_url ?? ''
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

vi.mock('@shokujii/common/utils/googleProfileImage.js', () => ({
  isGoogleProfileImageUrl: (...args: unknown[]) => isGoogleProfileImageUrlMock(...args),
  fetchGoogleProfileImage: (...args: unknown[]) => fetchGoogleProfileImageMock(...args),
}))

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({
    bucket: () => ({
      name: 'test-project.appspot.com',
      file: () => ({
        save: fileSaveMock,
      }),
    }),
  }),
}))

import { FirebaseAuthError } from 'firebase-admin/auth'
import {
  confirmEmailLogin,
  confirmEmailRegistration,
  requestEmailLogin,
  requestEmailRegistration,
  updateProfileFromProviders,
} from './user.js'

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

const callUpdateProfileFromProviders = (uid: string, additionalInfo?: Record<string, string>) =>
  (updateProfileFromProviders as unknown as CallableHandler<{ additionalInfo?: Record<string, string> }>)({
    auth: { uid },
    data: { additionalInfo },
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
    deleteUserMock.mockResolvedValue(undefined)
    deleteNewUserDocumentsMock.mockResolvedValue(undefined)
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
    expect(createCustomTokenMock).toHaveBeenCalledWith('uid-new')
  })

  it('saveUser 失敗時は pass code を削除せず Auth を rollback する', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })
    saveUserMock.mockRejectedValue(new Error('save failed'))

    await expect(callConfirmEmailRegistration('new@example.com', '123456')).rejects.toThrow('save failed')

    expect(createUserMock).toHaveBeenCalledOnce()
    expect(deleteUserMock).toHaveBeenCalledWith('uid-new')
    expect(deleteNewUserDocumentsMock).toHaveBeenCalledWith('uid-new')
    expect(createCustomTokenMock).not.toHaveBeenCalled()
    expect(deletePassCodeMock).not.toHaveBeenCalled()
  })

  it('deletePassCode 失敗時は Firestore と Auth を rollback する', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })
    deletePassCodeMock.mockRejectedValue(new Error('delete pass code failed'))

    await expect(callConfirmEmailRegistration('new@example.com', '123456')).rejects.toThrow('delete pass code failed')

    expect(saveUserMock).toHaveBeenCalledOnce()
    expect(deleteNewUserDocumentsMock).toHaveBeenCalledWith('uid-new')
    expect(deleteUserMock).toHaveBeenCalledWith('uid-new')
    expect(createCustomTokenMock).not.toHaveBeenCalled()
    expect(deletePassCodeMock).toHaveBeenCalledWith('pc-1')
  })

  it('deleteNewUserDocuments 失敗時も Auth を rollback する', async () => {
    getValidPassCodeFromEmailMock.mockResolvedValue({
      id: 'pc-1',
      pass_code: '123456',
      user_id: null,
    })
    deletePassCodeMock.mockRejectedValue(new Error('delete pass code failed'))
    deleteNewUserDocumentsMock.mockRejectedValue(new Error('delete firestore failed'))

    await expect(callConfirmEmailRegistration('new@example.com', '123456')).rejects.toThrow('delete pass code failed')

    expect(deleteNewUserDocumentsMock).toHaveBeenCalledWith('uid-new')
    expect(deleteUserMock).toHaveBeenCalledWith('uid-new')
    expect(createCustomTokenMock).not.toHaveBeenCalled()
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

describe('updateProfileFromProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveUserMock.mockResolvedValue(undefined)
    getAuthUserMock.mockResolvedValue({
      providerData: [{ email: 'new@example.com', displayName: 'New User', photoURL: '' }],
    })
  })

  it('新規 Firestore ユーザーでメール未登録なら saveUser する', async () => {
    getUserMock.mockResolvedValue(null)
    getUserIdFromEmailMock.mockResolvedValue(undefined)

    const result = await callUpdateProfileFromProviders('uid-new')

    expect(getUserIdFromEmailMock).toHaveBeenCalledWith('new@example.com')
    expect(saveUserMock).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ user: { user_email: 'new@example.com' } })
  })

  it('新規 Firestore ユーザーでメール登録済みなら already-exists を返す', async () => {
    getUserMock.mockResolvedValue(null)
    getUserIdFromEmailMock.mockResolvedValue('uid-existing')

    await expect(callUpdateProfileFromProviders('uid-new')).rejects.toMatchObject({
      code: 'already-exists',
    })
    expect(saveUserMock).not.toHaveBeenCalled()
  })

  it('既存 Firestore ユーザーではメール重複チェックをスキップする', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-existing',
      user_email: 'existing@example.com',
      user_name: 'Existing',
      user_image_url: '',
    })

    await callUpdateProfileFromProviders('uid-existing')

    expect(getUserIdFromEmailMock).not.toHaveBeenCalled()
  })

  it('有効な Google 画像を Storage に保存し gs:// URL をセットする', async () => {
    getUserMock.mockResolvedValue(null)
    getUserIdFromEmailMock.mockResolvedValue(undefined)
    getAuthUserMock.mockResolvedValue({
      providerData: [{ email: 'new@example.com', displayName: 'New User', photoURL: GOOGLE_PHOTO_URL }],
    })
    isGoogleProfileImageUrlMock.mockReturnValue(true)
    fetchGoogleProfileImageMock.mockResolvedValue({
      status: 'valid',
      blob: new Blob([Uint8Array.from([1, 2, 3])], { type: 'image/png' }),
    })
    fileSaveMock.mockResolvedValue(undefined)

    const result = await callUpdateProfileFromProviders('uid-google')

    expect(fetchGoogleProfileImageMock).toHaveBeenCalledWith(GOOGLE_PHOTO_URL)
    expect(fileSaveMock).toHaveBeenCalledOnce()
    expect(saveUserMock).toHaveBeenCalledOnce()
    expect(result).toMatchObject({
      user: { user_image_url: 'gs://test-project.appspot.com/users/uid-google/avatar' },
    })
  })

  it('Google プレースホルダー画像の場合は user_image_url を空にする', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-google',
      user_email: 'user@example.com',
      user_name: 'User',
      user_image_url: GOOGLE_PHOTO_URL,
    })
    getAuthUserMock.mockResolvedValue({
      providerData: [{ email: 'user@example.com', displayName: 'User', photoURL: GOOGLE_PHOTO_URL }],
    })
    isGoogleProfileImageUrlMock.mockReturnValue(true)
    fetchGoogleProfileImageMock.mockResolvedValue({ status: 'placeholder' })

    const result = await callUpdateProfileFromProviders('uid-google')

    expect(saveUserMock).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ user: { user_image_url: '' } })
    expect(fileSaveMock).not.toHaveBeenCalled()
  })

  it('Google 画像 fetch が indeterminate の場合は user_image_url を維持する', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-google',
      user_email: 'user@example.com',
      user_name: 'User',
      user_image_url: GOOGLE_PHOTO_URL,
    })
    getAuthUserMock.mockResolvedValue({
      providerData: [{ email: 'user@example.com', displayName: 'User', photoURL: GOOGLE_PHOTO_URL }],
    })
    isGoogleProfileImageUrlMock.mockReturnValue(true)
    fetchGoogleProfileImageMock.mockResolvedValue({ status: 'indeterminate' })

    const result = await callUpdateProfileFromProviders('uid-google')

    expect(saveUserMock).not.toHaveBeenCalled()
    expect(result).toMatchObject({ user: { user_image_url: GOOGLE_PHOTO_URL } })
    expect(fileSaveMock).not.toHaveBeenCalled()
  })

  it('既に gs:// の場合は Google fetch と Storage 保存をスキップする', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-google',
      user_email: 'user@example.com',
      user_name: 'User',
      user_image_url: GS_PHOTO_URL,
    })
    getAuthUserMock.mockResolvedValue({
      providerData: [{ email: 'user@example.com', displayName: 'User', photoURL: GOOGLE_PHOTO_URL }],
    })
    isGoogleProfileImageUrlMock.mockReturnValue(false)

    const result = await callUpdateProfileFromProviders('uid-google')

    expect(fetchGoogleProfileImageMock).not.toHaveBeenCalled()
    expect(fileSaveMock).not.toHaveBeenCalled()
    expect(saveUserMock).not.toHaveBeenCalled()
    expect(result).toMatchObject({ user: { user_image_url: GS_PHOTO_URL } })
  })

  it('既存ユーザーの user_description は X bio で上書きしない', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-existing',
      user_description: 'shokujii で書いた自己紹介',
      user_sns_twitter: '',
    })

    const result = await callUpdateProfileFromProviders('uid-existing', {
      user_description: 'X のプロフィール文',
      user_sns_twitter: 'my_x_handle',
    })

    expect(result).toMatchObject({
      user: {
        user_description: 'shokujii で書いた自己紹介',
        user_sns_twitter: 'my_x_handle',
      },
    })
    expect(saveUserMock).toHaveBeenCalledOnce()
  })

  it('既存ユーザーの user_description が空なら X bio で補完する', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-existing',
      user_description: '',
    })

    const result = await callUpdateProfileFromProviders('uid-existing', {
      user_description: 'X のプロフィール文',
    })

    expect(result).toMatchObject({
      user: { user_description: 'X のプロフィール文' },
    })
    expect(saveUserMock).toHaveBeenCalledOnce()
  })

  it('既存ユーザーの user_sns_twitter は OAuth username で上書きする', async () => {
    getUserMock.mockResolvedValue({
      id: 'uid-existing',
      user_sns_twitter: 'manual_handle',
    })

    const result = await callUpdateProfileFromProviders('uid-existing', {
      user_sns_twitter: 'oauth_handle',
    })

    expect(result).toMatchObject({
      user: { user_sns_twitter: 'oauth_handle' },
    })
    expect(saveUserMock).toHaveBeenCalledOnce()
  })
})
