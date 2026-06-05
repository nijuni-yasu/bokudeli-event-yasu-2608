import { initializeApp, applicationDefault } from 'firebase-admin/app'

initializeApp({
  credential: applicationDefault(),
})

/** Phase 2b 移行済み。Phase 3 で codebase ごと削除予定。 */
