import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { onCall, HttpsError } from 'firebase-functions/https'
import { DateTime } from 'luxon'
import _ from 'lodash'
import {
  ConfirmEmailChangeRequest,
  ConfirmEmailChangeResponse,
  ConfirmEmailLoginRequest,
  ConfirmEmailLoginResponse,
  RequestEmailChangeRequest,
  RequestEmailLoginRequest,
  RequestEmailLoginResponse,
  UpdateProfileFromProvidersRequest,
  UpdateProfileFromProvidersResponse,
} from '@shokujii/common/apis/user.js'
import { fetchFacebookImage, fetchTwitterImage } from '@shokujii/common/utils/user.js'
import { getUser, getUserIdFromEmail, saveUser, ShokujiiUser } from './stores/user.js'
import { savePassCode, ShokujiiPassCode, getValidPassCodeFromEmail, deletePassCode } from './stores/passCode.js'
import { send } from './utils/sendgrid.js'
import { DEFAULT_FROM } from './utils/mail.js'

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
    const isNew = userId == null
    const passCode = isNew
      ? new ShokujiiPassCode(null, { user_email: email })
      : new ShokujiiPassCode(null, { user_id: userId, user_email: email })
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
    return {
      isNew,
    }
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
    const promises = [deletePassCode(passCodeDocument.id)]
    let isNew: boolean
    let uid: string
    if (passCodeDocument.user_id == null) {
      isNew = true
      const user = await getAuth().createUser({ email, emailVerified: true })
      uid = user.uid
      promises.push(
        saveUser(
          new ShokujiiUser(uid, {
            user_email: email,
          }),
        ),
      )
    } else {
      isNew = false
      uid = passCodeDocument.user_id
    }
    const [token] = await Promise.all([getAuth().createCustomToken(uid), ...promises])
    return { token, isNew }
  },
)

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

  const stem = `avatar_${DateTime.now().toFormat('yyyyMMddHHmmss')}`
  const path = `users/${uid}/${stem}`
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
    user.user_image_url = user.user_image_url || provider.photoURL
  }
  for (const key of ADDITIONAL_KEYS) {
    const value = additionalInfo?.[key]
    if (value !== undefined) {
      user[key] = value
    }
  }
  // Facebook, Twitter の場合は、画像を Storage にアップロードする
  // ただし、Login の度に画像を Storage にアップロードするわけにはいかないので、既存の画像がない場合のみ
  // 想定ケースはFacebookとTwitterでの初回ログイン、メアドログインで画像が設定されていない際にいずれかのSNS連携を実施した場合
  let blob: Blob | null = null
  if (user.user_image_url.startsWith('https://graph.facebook.com')) {
    blob = await fetchFacebookImage(user.user_image_url)
  } else if (user.user_image_url.startsWith('https://pbs.twimg.com')) {
    blob = await fetchTwitterImage(user.user_image_url)
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
