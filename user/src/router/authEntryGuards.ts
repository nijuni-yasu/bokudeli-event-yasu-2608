import { getAuth, signOut, type UserCredential } from 'firebase/auth'

/**
 * /login 導線で OAuth により誤って作成された Auth ユーザーを削除してサインアウトする。
 * signOut のみだと Auth 孤児が残り、2 回目以降 isNewUser=false で暗黙登録をバイパスしうる。
 */
export async function rejectNewUserOnLogin(userCredential: UserCredential): Promise<void> {
  try {
    await userCredential.user.delete()
  } catch (err) {
    console.error('Failed to delete rejected Auth user:', err)
  }
  await signOut(getAuth())
}
