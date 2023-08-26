const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');


initializeApp({
    credential: applicationDefault(),
});
const db = getFirestore();

const env = process.env;

// 秘密鍵を使用してStripeを初期化
const stripe = require('stripe')(env.STRIPE_SECRET_KEY); 
const stripeWebhookEndpointSecret = env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

const app = express();

const loadUser = async (userId) => {
    const userRef = db.collection('users').doc(userId);
    const userDocSnap = await userRef.get();

    return userDocSnap.exists() ? (userDocSnap.data()) : null;
}

const addCommunityUser = async (community_id, userId) => {
    const communityId = community_id;
    const userDoc = await loadUser(userId);

    if (!userDoc) {
        return;
    }

    const membersUserDoc = db.doc(`communities/${communityId}/members/${userDoc.user_id}`);
    userDoc.updated_at = Timestamp.now();
    await membersUserDoc.update(userDoc);
}

app.post('/', async(request, response) => {
    const sig = request.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(request.rawBody, sig, stripeWebhookEndpointSecret);

        const orderRef = db.collectionGroup('orders').where('order_id', '==', event.orderId);

        const orderSnapshot = await orderRef.get();
        const orderDocument = orderSnapshot.docs[0];

        switch (event.type) {
            case 'checkout.session.completed': {
                const paymentIntent = event.data.object;
                await orderDocument.ref.update({ status: 'ordered', updated_at: admin.firestore.Timestamp.now() }, { merge: true });
                await addCommunityUser(paymentIntent.metadata.community_id, paymentIntent.metadata.userId);
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