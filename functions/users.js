import functions from 'firebase-functions'
import { getFirestore, Timestamp} from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const db = getFirestore()

export const create_or_update_user = functions.region('asia-northeast1').https.onCall(async (data) => {
  try {
    const { user_email, pass_code } = data
    const userSnapshot = await db.collection('users').where('user_email', '==', user_email).get()

    if (!userSnapshot.empty) {
      // ユーザーが存在する場合、pass_code を追加して更新
      const userDoc = userSnapshot.docs[0]
      await userDoc.ref.update({
        pass_code: pass_code,
        update_at: Timestamp.now()
      });
      console.log(`ユーザー ${user_email} にパスコードが追加されました。`)
    } else {
      // ユーザーが存在しない場合、新規にユーザーを作成
      // TODO: usersの他のカラムについて確認
      await db.collection('users').add({
        user_email: user_email,
        pass_code: pass_code,
        created_at: Timestamp.now(),
        update_at: Timestamp.now()
      });
      console.log(`新規ユーザー ${user_email} が作成され、パスコードが保存されました。`)
      // TODO: 新規か既存アカウントかをbooleanで返す
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error)
  }
})

export const verify_pass_code = functions.region('asia-northeast1').https.onCall(async (data) => {
  try {
    const { user_email, pass_code } = data
    // TODO: 検証用。削除すること
    console.log('user_email', user_email, 'pass_code', pass_code)

    const userSnapshot = await db.collection('users').where('user_email', '==', user_email).get()
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      const matchedPassCode = userDoc.data().pass_code === pass_code

      // カスタムエラーを早期リターン
      if (!matchedPassCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Pass code does not match.')
      }

      const currentDate = new Date()
      await userDoc.ref.update({
        pass_code: null,
        verified_at: currentDate
      })

      const userId = userDoc.data().user_id
      // TODO: 検証用。削除すること
      console.log('userId', userId)
      const customToken = await getAuth().createCustomToken(userId)

      return { customToken }
    } else {
      throw new functions.https.HttpsError('not-found', 'User not found.')
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error)
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred.')
  }
})