import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { initializeFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: applicationDefault(),
})
initializeFirestore(app, { preferRest: true })

export const { send_email } = await import('./sendgrid-mail.js')
export const { on_write_community_members } = await import('./community-members.js')
export const { create_event_members } = await import('./event-members.js')
export const { scheduled_firestore_export } = await import('./backup.js')
export const { log_event_status } = await import('./event-logging.js')
export { namesprint } from './namesprint.js'
export { flyer } from './flyer.js'
