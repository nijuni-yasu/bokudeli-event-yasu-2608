import {initializeApp, applicationDefault, cert} from 'firebase-admin/app'
import { initializeFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: applicationDefault(),
})
initializeFirestore(app, { preferRest: true })

export const { replace_ogp_tags } = await import('./common.js')
export const { stripe_webhook } = await import('./stripe-webhook.js')
export const { stripe_refunds } = await import('./stripe-refunds.js')
export const {
  polling,
  event_information,
  event_information_preview,
  on_event_changed,
  on_shop_changed,
  on_order_changed,
  community_added,
  community_contact,
  send_email,
  send_pass_code
} = await import('./sendgrid-mail.js')
export const { create_community_members, delete_community_members } = await import('./community-members.js')
export const { create_event_members } = await import('./event-members.js')
export const { on_object_finalized } = await import('./storage-image.js')
export const { scheduled_firestore_export } = await import('./backup.js')
export const { get_invitaion_url_for_community_manager, accept_invitation_for_community_manager } = await import(
  './community-manager.js'
)
export const { log_event_status } = await import('./event-logging.js')
export const { create_or_update_user, verify_pass_code, get_custom_token } = await import('./users.js')
