import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/https'
import { getUser, saveUser, ShokujiiUser } from './stores/user.js'

export const createOrUpdateUser = onCall(async (request) => {
  const { user_email, user_pass_code, user_email_pending } = request.data

  const db = getFirestore()

  // 直接ドキュメントを検索するのはベストではないが、仕様的に仕方がないのでとりあえずこの状態で維持する
  let personalInformationSnapshot
  if (user_email_pending) {
    personalInformationSnapshot = await db
      .collection('users_personal_information')
      .where('user_email_pending', '==', user_email_pending)
      .get()
  } else {
    personalInformationSnapshot = await db
      .collection('users_personal_information')
      .where('user_email', '==', user_email)
      .get()
  }
  const personalInformationId = personalInformationSnapshot.docs[0]?.id

  let is_new: boolean
  if (personalInformationId != null) {
    const user = await getUser(personalInformationId, true)
    if (user == null) {
      throw new HttpsError('invalid-argument', 'User not exist.')
    }
    // ユーザーが存在する場合、pass_code を追加して更新
    user.user_pass_code = user_pass_code
    saveUser(user)
    is_new = false
  } else {
    saveUser(
      new ShokujiiUser(null, {
        user_pass_code,
        user_email,
      }),
    )
    is_new = true
  }
  return { is_new }
})

export const verifyPassCode = onCall(async (request) => {
  const { user_email, user_pass_code, user_email_pending } = request.data

  const db = getFirestore()

  // 直接ドキュメントを検索するのはベストではないが、仕様的に仕方がないのでとりあえずこの状態で維持する
  let personalInformationSnapshot
  if (user_email_pending) {
    personalInformationSnapshot = await db
      .collection('users_personal_information')
      .where('user_email_pending', '==', user_email_pending)
      .get()
  } else {
    personalInformationSnapshot = await db
      .collection('users_personal_information')
      .where('user_email', '==', user_email)
      .get()
  }
  const personalInformationId = personalInformationSnapshot.docs[0]?.id
  const user = await getUser(personalInformationId, true)

  if (user != null) {
    const matchedPassCode = user.user_pass_code === user_pass_code

    // カスタムエラーを早期リターン
    if (!matchedPassCode) {
      throw new HttpsError('invalid-argument', 'Pass code does not match.')
    }

    user.user_pass_code = ''
    user.verified_at = Date.now()
    saveUser(user)

    return await getAuth().createCustomToken(user.id)
  } else {
    throw new HttpsError('not-found', 'User not found.')
  }
})

export const getCustomToken = onCall(async (request) => {
  const { user_email } = request.data

  const db = getFirestore()

  // 直接ドキュメントを検索するのはベストではないが、仕様的に仕方がないのでとりあえずこの状態で維持する
  const personalInformationSnapshot = await db
    .collection('users_personal_information')
    .where('user_email', '==', user_email)
    .get()
  const id = personalInformationSnapshot.docs[0]?.id
  if (id != null) {
    return await getAuth().createCustomToken(id)
  } else {
    throw new HttpsError('not-found', 'User not found.')
  }
})
