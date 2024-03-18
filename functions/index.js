import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
});

export const {
  replace_ogp_tags
} = await import('./common.js');
export const { stripe_webhook } = await import('./stripe-webhook.js');
export const { stripe_refunds } = await import('./stripe-refunds.js');
export const {
  polling,
  event_information,
  on_event_changed,
  on_shop_changed,
  community_added,
  community_contact
} = await import('./sendgrid-mail.js');
export const {
  create_community_members,
  delete_community_members
} = await import('./community-members.js');
export const {
  create_event_members
} = await import('./event-members.js');
export const {
  on_object_finalized
} = await import('./storage-image.js');
export const {
  scheduled_firestore_export
} = await import('./backup.js');
