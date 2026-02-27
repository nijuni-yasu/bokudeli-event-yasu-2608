import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { initializeFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: applicationDefault(),
})
initializeFirestore(app, { preferRest: true })

export const { stripe_webhook } = await import('./stripe-webhook.js')
export const { stripe_refunds } = await import('./stripe-refunds.js')
export const {
  polling,
  on_event_changed,
  send_email,
} = await import('./sendgrid-mail.js')
export const { on_write_community_members } = await import('./community-members.js')
export const { create_event_members } = await import('./event-members.js')
export const { on_object_finalized } = await import('./storage-image.js')
export const { scheduled_firestore_export } = await import('./backup.js')
export const { log_event_status } = await import('./event-logging.js')
export const { update_order_status } = await import('./orders.js')
export { namesprint } from './namesprint.js'
export { eventBillInvoice } from './eventBillInvoice.js'
export { flyer } from './flyer.js'
