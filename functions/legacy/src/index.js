import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { initializeFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: applicationDefault(),
})
initializeFirestore(app, { preferRest: true })

/** Phase 2a 移行済み。send_email のみ legacy に残置。フロント未使用・Phase 3 で codebase ごと削除予定。 */
export const { send_email } = await import('./sendgrid-mail.js')
