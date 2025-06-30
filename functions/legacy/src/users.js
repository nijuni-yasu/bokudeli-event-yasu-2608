import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { v4 as uuidv4 } from 'uuid'

const db = getFirestore()

export const create_or_update_user = functions.region('asia-northeast1').https.onCall(async (data) => {
  try {
    const { user_email, user_pass_code, user_email_pending } = data

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

    let userSnapshot
    if (personalInformationId) {
      userSnapshot = await db.collection('users').where('user_id', '==', personalInformationId).get()
    } else {
      userSnapshot = {
        empty: true,
      }
    }

    if (!userSnapshot.empty) {
      // ユーザーが存在する場合、pass_code を追加して更新
      const userDoc = userSnapshot.docs[0]
      await userDoc.ref.update({
        user_pass_code: user_pass_code,
        updated_at: Timestamp.now(),
      })
      return { is_new: false }
    } else {
      // ユーザーが存在しない場合、新規にユーザーを作成
      const userId = generateFirestoreUserId()
      await db.collection('users').doc(userId).set({
        user_id: userId,
        user_name: '',
        user_image_url: null,
        user_account: null,
        user_description: null,
        user_sns_facebook: null,
        user_sns_twitter: null,
        user_sns_instagram: null,
        user_sns_website: null,
        user_pass_code: user_pass_code,
        verified_at: null,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      })

      await db.collection('users_personal_information').doc(userId).set({
        user_email: user_email,
      })
      return { is_new: true }
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error)
  }
})

export const verify_pass_code = functions.region('asia-northeast1').https.onCall(async (data) => {
  try {
    const { user_email, user_pass_code, user_email_pending } = data

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
    console.log('personalInformationSnapshot', personalInformationSnapshot.docs[0]?.id)
    const userSnapshot = await db
      .collection('users')
      .where('user_id', '==', personalInformationSnapshot.docs[0].id)
      .get()
    console.log('userSnapshot', userSnapshot.docs[0])
    if (!userSnapshot.empty || !personalInformationSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      const matchedPassCode = userDoc.data().user_pass_code === user_pass_code

      // カスタムエラーを早期リターン
      if (!matchedPassCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Pass code does not match.')
      }

      await userDoc.ref.update({
        user_pass_code: null,
      })

      if (!personalInformationSnapshot.docs[0].data().user_email_pending) {
        await userDoc.ref.update({
          verified_at: Timestamp.now(),
        })
      }

      const userId = userDoc.data().user_id

      return await getAuth().createCustomToken(userId)
    } else {
      throw new functions.https.HttpsError('not-found', 'User not found.')
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error)
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred.')
  }
})

export const get_custom_token = functions.region('asia-northeast1').https.onCall(async (data) => {
  try {
    const { user_email } = data

    const personalInformationSnapshot = await db
      .collection('users_personal_information')
      .where('user_email', '==', user_email)
      .get()
    const userSnapshot = await db
      .collection('users')
      .where('user_id', '==', personalInformationSnapshot.docs[0].id)
      .get()
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      const userId = userDoc.data().user_id

      return await getAuth().createCustomToken(userId)
    } else {
      throw new functions.https.HttpsError('not-found', 'User not found.')
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error)
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred.')
  }
})

const generateFirestoreUserId = () => uuidv4().replace(/-/g, '').substring(0, 28)
