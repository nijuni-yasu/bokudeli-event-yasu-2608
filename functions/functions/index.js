const { initializeApp, applicationDefault } = require('firebase-admin/app');

initializeApp({
    credential: applicationDefault(),
});

exports.stripe_webhook = require('./stripe-webhook').stripe_webhook;
