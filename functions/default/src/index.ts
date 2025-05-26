Object.defineProperty(globalThis, 'IS_SERVER', {
  value: true,
  writable: false, // 値を変更不可にする
  configurable: false, // 再定義を防ぐ
})

// https://firebase.google.com/docs/functions/typescript
import { setGlobalOptions } from 'firebase-functions/v2/options'
import { initializeApp } from 'firebase-admin/app'

initializeApp()
setGlobalOptions({ region: 'asia-northeast1' })

// ES module 形式の import は並列読み込みのため、initializeApp 等の呼び出しが先に行われることを保証できない
// そのため、ここでは 動的 import を使い、静的 import より後に実行されることを保証する
const [{ getInvitaionUrlForCommunityManager, acceptInvitationForCommunityManager }] = await Promise.all([
  import('./communityManager.js'),
])
export { getInvitaionUrlForCommunityManager, acceptInvitationForCommunityManager }
