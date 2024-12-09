import functions from 'firebase-functions'
import { getFirestore, Timestamp} from 'firebase-admin/firestore'

const db = getFirestore()

export const create_or_update_user = functions.region('asia-northeast1').https.onCall(async (data) => {
  const { user_email, pass_code } = data

  try {
    const userSnapshot = await db.collection('users').where('user_email', '==', user_email).get();

    if (!userSnapshot.empty) {
      // ユーザーが存在する場合、pass_code を追加して更新
      const userDoc = userSnapshot.docs[0];
      await userDoc.ref.update({
        pass_code: pass_code,
        update_at: Timestamp.now()
      });
      console.log(`ユーザー ${user_email} にパスコードが追加されました。`);
    } else {
      // ユーザーが存在しない場合、新規にユーザーを作成
      // TODO: usersの他のカラムについて確認
      await db.collection('users').add({
        user_email: user_email,
        pass_code: pass_code,
        created_at: Timestamp.now(),
        update_at: Timestamp.now()
      });
      console.log(`新規ユーザー ${user_email} が作成され、パスコードが保存されました。`);
    }
  } catch (error) {
    console.error('エラーが発生しました: ', error);
  }
})