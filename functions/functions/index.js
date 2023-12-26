const { initializeApp, applicationDefault } = require('firebase-admin/app');

initializeApp({
    credential: applicationDefault(),
});

exports.stripe_webhook = require('./stripe-webhook').stripe_webhook;
exports.polling = require('./sendgrid-mail').polling;
exports.event_information = require('./sendgrid-mail').event_information;
exports.on_event_changed = require('./sendgrid-mail').on_event_changed;
exports.on_shop_changed = require('./sendgrid-mail').on_shop_changed;
exports.community_contact = require('./sendgrid-mail').community_contact;