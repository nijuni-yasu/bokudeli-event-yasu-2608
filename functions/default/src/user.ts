import { FirebaseAuthError, getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { onCall, HttpsError } from 'firebase-functions/https'
import _ from 'lodash'
import {
  ConfirmEmailChangeRequest,
  ConfirmEmailChangeResponse,
  ConfirmEmailLoginRequest,
  ConfirmEmailLoginResponse,
  ConfirmEmailRegistrationRequest,
  ConfirmEmailRegistrationResponse,
  RequestEmailChangeRequest,
  RequestEmailLoginRequest,
  RequestEmailLoginResponse,
  RequestEmailRegistrationRequest,
  RequestEmailRegistrationResponse,
  UpdateProfileFromProvidersRequest,
  UpdateProfileFromProvidersResponse,
} from '@shokujii/common/apis/user.js'
import { getUserImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { fetchFacebookImage, fetchTwitterImage } from '@shokujii/common/utils/user.js'
import { fetchGoogleProfileImage, isGoogleProfileImageUrl } from '@shokujii/common/utils/googleProfileImage.js'
import { getUser, getUserIdFromEmail, saveUser, ShokujiiUser } from './stores/user.js'
import { savePassCode, ShokujiiPassCode, getValidPassCodeFromEmail, deletePassCode } from './stores/passCode.js'
import { send } from './utils/sendgrid.js'
import { DEFAULT_FROM } from './utils/mail.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('user')
const USER_PASS_CODE_TEMPLATE_ID = 'd-84540f5feaf8422484b65bdc2be739fe'

export const requestEmailLogin = onCall<RequestEmailLoginRequest, Promise<RequestEmailLoginResponse>>(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const { email } = request.data
    if (email == null) {
      throw new HttpsError('invalid-argument', 'email is null')
    }
    const userId = await getUserIdFromEmail(email)
    if (userId == null) {
      throw new HttpsError('not-found', 'user not registered')
    }
    const passCode = new ShokujiiPassCode(null, { user_id: userId, user_email: email })
    await Promise.all([
      savePassCode(passCode),
      send({
        to: email,
        from: DEFAULT_FROM,
        templateId: USER_PASS_CODE_TEMPLATE_ID,
        dynamicTemplateData: {
          user_pass_code: passCode.pass_code,
        },
      }),
    ])
    return { success: true }
  },
)

export const confirmEmailLogin = onCall<ConfirmEmailLoginRequest, Promise<ConfirmEmailLoginResponse>>(
  async (request) => {
    const { email, passCode } = request.data
    if (email == null || passCode == null) {
      throw new HttpsError('invalid-argument', 'email or passCode is null')
    }
    const passCodeDocument = await getValidPassCodeFromEmail(email)
    if (passCodeDocument == null || passCodeDocument.pass_code !== passCode) {
      throw new HttpsError('invalid-argument', 'pass code is not valid')
    }
    if (passCodeDocument.user_id == null) {
      throw new HttpsError('invalid-argument', 'pass code is not valid')
    }
    const uid = passCodeDocument.user_id
    const [token] = await Promise.all([getAuth().createCustomToken(uid), deletePassCode(passCodeDocument.id)])
    return { token }
  },
)

export const requestEmailRegistration = onCall<
  RequestEmailRegistrationRequest,
  Promise<RequestEmailRegistrationResponse>
>(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const { email } = request.data
    if (email == null) {
      throw new HttpsError('invalid-argument', 'email is null')
    }
    const userId = await getUserIdFromEmail(email)
    if (userId != null) {
      throw new HttpsError('already-exists', 'The email address has been already used')
    }
    const passCode = new ShokujiiPassCode(null, { user_email: email })
    await Promise.all([
      savePassCode(passCode),
      send({
        to: email,
        from: DEFAULT_FROM,
        templateId: USER_PASS_CODE_TEMPLATE_ID,
        dynamicTemplateData: {
          user_pass_code: passCode.pass_code,
        },
      }),
    ])
    return { success: true }
  },
)

export const confirmEmailRegistration = onCall<
  ConfirmEmailRegistrationRequest,
  Promise<ConfirmEmailRegistrationResponse>
>(async (request) => {
  const { email, passCode } = request.data
  if (email == null || passCode == null) {
    throw new HttpsError('invalid-argument', 'email or passCode is null')
  }
  const passCodeDocument = await getValidPassCodeFromEmail(email)
  if (passCodeDocument == null || passCodeDocument.pass_code !== passCode) {
    throw new HttpsError('invalid-argument', 'pass code is not valid')
  }
  if (passCodeDocument.user_id != null) {
    throw new HttpsError('invalid-argument', 'pass code is not valid')
  }
  let user
  try {
    user = await getAuth().createUser({ email, emailVerified: true })
  } catch (error) {
    if (error instanceof FirebaseAuthError && error.code === 'auth/email-already-exists') {
      logger.warn('confirmEmailRegistration: email already exists in Auth', { email })
      throw new HttpsError('already-exists', 'The email address has been already used')
    }
    throw error
  }
  const uid = user.uid
  const token = await getAuth().createCustomToken(uid)
  await saveUser(
    new ShokujiiUser(uid, {
      user_email: email,
    }),
  )
  await deletePassCode(passCodeDocument.id)
  return { token }
})

export const requestEmailChange = onCall<RequestEmailChangeRequest>(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', 'not logged in')
    }
    const { newEmail } = request.data
    if (newEmail == null) {
      throw new HttpsError('invalid-argument', 'newEmail is null')
    }
    const checkedUid = await getUserIdFromEmail(newEmail)
    if (checkedUid != null) {
      throw new HttpsError('already-exists', 'The email address has been already used')
    }
    const passCode = new ShokujiiPassCode(null, { user_id: uid, user_email: newEmail })
    await Promise.all([
      savePassCode(passCode),
      send({
        to: newEmail,
        from: DEFAULT_FROM,
        templateId: USER_PASS_CODE_TEMPLATE_ID,
        dynamicTemplateData: {
          user_pass_code: passCode.pass_code,
        },
      }),
    ])
  },
)

export const confirmEmailChange = onCall<ConfirmEmailChangeRequest, Promise<ConfirmEmailChangeResponse>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', 'not logged in')
    }
    const { passCode, newEmail } = request.data
    if (passCode == null || newEmail == null) {
      throw new HttpsError('invalid-argument', 'passCode or newEmail is null')
    }
    const user = await getUser(uid, true)
    if (user == null) {
      throw new HttpsError('internal', 'no user')
    }
    const passCodeDocument = await getValidPassCodeFromEmail(newEmail)
    if (passCodeDocument == null || passCodeDocument.pass_code !== passCode || passCodeDocument.user_id !== uid) {
      throw new HttpsError('invalid-argument', 'pass code is not valid')
    }
    user.user_email = newEmail
    const [token] = await Promise.all([
      getAuth().createCustomToken(uid),
      deletePassCode(passCodeDocument.id),
      getAuth().updateUser(uid, { email: newEmail }),
      saveUser(user),
    ])
    return { token }
  },
)

const uploadUserImage = async (uid: string, blob: Blob) => {
  const bucket = getStorage().bucket()
  // Blob -> Buffer へ変換（Admin SDK は Buffer/stream を受け付ける）
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const path = getUserImageStoragePath(uid)
  const file = bucket.file(path)
  const contentType = blob.type != null && blob.type !== '' ? blob.type : 'image/*'

  await file.save(buffer, {
    contentType,
    metadata: {
      contentType,
    },
  })
  return `gs://${bucket.name}/${path}`
}

const ADDITIONAL_KEYS = ['user_description', 'user_sns_twitter'] as const

export const updateProfileFromProviders = onCall<
  UpdateProfileFromProvidersRequest,
  Promise<UpdateProfileFromProvidersResponse>
>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', 'not logged in')
  }
  const { additionalInfo } = request.data
  let user = await getUser(uid, true)
  // 元のユーザー情報を保存
  // 新規ユーザーの場合は ShokujiiUser ではなく空オブジェクトにしておく
  const originalUser = user == null ? {} : _.cloneDeep(user)
  user = user ?? new ShokujiiUser(uid, {})

  const providerData = (await getAuth().getUser(uid)).providerData
  for (const provider of providerData) {
    user.user_email = user.user_email || provider.email
    user.user_name = user.user_name || provider.displayName
    user.user_image_url = user.user_image_url || provider.photoURL || ''
  }
  for (const key of ADDITIONAL_KEYS) {
    const value = additionalInfo?.[key]
    if (value != null) {
      user[key] = value
    }
  }
  // Facebook, Twitter, Google の場合は、外部 URL の画像を Storage にアップロードする
  // gs:// 形式に移行済みの場合は対象外。外部 URL が残っている間はログインのたびに fetch + upload を試みる
  // Google の場合は停止・削除アカウントのプレースホルダー画像を除外し、有効な画像のみ Storage に保存する
  let blob: Blob | null = null
  const imageUrl = user.user_image_url
  try {
    if (imageUrl.startsWith('https://graph.facebook.com')) {
      blob = await fetchFacebookImage(imageUrl)
    } else if (imageUrl.startsWith('https://pbs.twimg.com')) {
      blob = await fetchTwitterImage(imageUrl)
    } else if (isGoogleProfileImageUrl(imageUrl)) {
      const googleResult = await fetchGoogleProfileImage(imageUrl)
      if (googleResult.status === 'valid') {
        blob = googleResult.blob
      } else if (googleResult.status === 'placeholder') {
        user.user_image_url = ''
      }
    }
  } catch (error) {
    // 画像が取得できない場合は致命的なエラーとはみなさず、ログを記録してスキップ
    // SNSの画像URL仕様変更や一時的なエラーでも、ユーザー登録自体は継続させたい
    const provider = imageUrl.startsWith('https://graph.facebook.com')
      ? 'Facebook'
      : imageUrl.startsWith('https://pbs.twimg.com')
        ? 'Twitter'
        : isGoogleProfileImageUrl(imageUrl)
          ? 'Google'
          : 'unknown'
    logger.warn('Failed to fetch profile image', { provider, url: imageUrl, error: String(error) })
  }
  if (blob != null) {
    user.user_image_url = await uploadUserImage(uid, blob)
  }

  // 新規ユーザーの場合は空オブジェクトとの比較になるので必ず保存、
  // 既存ユーザーの場合は差分がある場合のみ保存
  if (!_.isEqual(originalUser, user)) {
    await saveUser(user)
  }

  return {
    user,
  }
})
