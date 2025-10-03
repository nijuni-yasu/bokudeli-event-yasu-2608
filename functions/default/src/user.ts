import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/https'
import { getUser, getUserIdFromEmail, saveUser, ShokujiiUser } from './stores/user.js'
import {
  ConfirmEmailChangeRequest,
  ConfirmEmailLoginRequest,
  ConfirmEmailLoginResponse,
  RequestEmailChangeRequest,
  RequestEmailLoginRequest,
  RequestEmailLoginResponse,
} from '@shokujii/common/apis/user.js'
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
    let uid: string
    if (passCodeDocument.user_id == null) {
      const user = await getAuth().createUser({ email })
      uid = user.uid
      promises.push(
        saveUser(
          new ShokujiiUser(uid, {
            user_email: email,
          }),
        ),
      )
    } else {
      uid = passCodeDocument.user_id
    }
    const [token] = await Promise.all([getAuth().createCustomToken(uid), ...promises])
    return { token }
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

export const confirmEmailChange = onCall<ConfirmEmailChangeRequest>(async (request) => {
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
  await Promise.all([
    deletePassCode(passCodeDocument.id),
    getAuth().updateUser(uid, { email: newEmail }),
    saveUser(user),
  ])
})
