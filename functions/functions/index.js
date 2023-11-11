const { initializeApp, applicationDefault } = require('firebase-admin/app');

initializeApp({
    credential: applicationDefault(),
});

exports.stripe_webhook = require('./stripe-webhook').stripe_webhook;
exports.polling = require('./sendgrid-mail').polling;
exports.event_information = require('./sendgrid-mail').event_information;
