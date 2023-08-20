const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const env = process.env;
const stripe = require('stripe')(env.STRIPE_PUBLISHABLE_KEY);
const stripeWebhookEndpointSecret = env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

const app = express();

// rawBodyを保存するミドルウェアを追加
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.post('/', (request, response) => {
    const sig = request.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(request.rawBody, sig, stripeWebhookEndpointSecret);

        switch (event.type) {
            case 'checkout.session.completed': {
                const paymentIntent = event.data.object;
                console.log(paymentIntent);
                response.json({ paymentIntent });
                break;
            }
            default:
                return response.status(400).end();
        }
    } catch (err) {
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
});

exports.stripe_webhook = functions.region('asia-northeast1').https.onRequest(app);
