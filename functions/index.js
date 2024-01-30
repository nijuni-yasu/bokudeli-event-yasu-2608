const { initializeApp, applicationDefault } = require('firebase-admin/app');

initializeApp({
    credential: applicationDefault(),
});

exports.stripe_webhook = require('./stripe-webhook').stripe_webhook;
exports.stripe_refunds = require('./stripe-refunds').stripe_refunds;
exports.polling = require('./sendgrid-mail').polling;
// exports.event_information = require('./sendgrid-mail').event_information;
exports.on_event_changed = require('./sendgrid-mail').on_event_changed;
exports.on_shop_changed = require('./sendgrid-mail').on_shop_changed;
exports.community_added = require('./sendgrid-mail').community_added;
exports.community_contact = require('./sendgrid-mail').community_contact;
exports.create_community_members = require('./community-members').create_community_members;
exports.delete_community_members = require('./community-members').delete_community_members;
