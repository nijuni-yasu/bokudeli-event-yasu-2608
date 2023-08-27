const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');


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

    return userDocSnap.exists ? (userDocSnap.data()) : null;
}

const addCommunityUser = async (communityId, userId) => {
    const userDoc = await loadUser(userId);

    if (!userDoc) {
        return;
    }

    const membersUserDoc = db.doc(`communities/${communityId}/members/${userDoc.user_id}`);
    userDoc.updated_at = Timestamp.now();
    await membersUserDoc.set(userDoc);
}

app.post('/', async(request, response) => {
    const sig = request.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(request.rawBody, sig, stripeWebhookEndpointSecret);
        const updated_at = Timestamp.now()
        const orderRef = db.collectionGroup('orders').where('order_id', '==', event.data.object.metadata.orderId);

        const orderSnapshot = await orderRef.get();
        const orderDocument = orderSnapshot.docs[0];

        switch (event.type) {
            case 'checkout.session.completed': {
                const paymentIntent = event.data.object;
                if (orderDocument && orderDocument.ref) {
                    await orderDocument.ref.set({ status: 'ordered', updated_at: updated_at }, { merge: true });
                } else {
                    console.error('orderDocument or orderDocument.ref is undefined.');
                }
                await addCommunityUser(paymentIntent.metadata.communityId, paymentIntent.metadata.userId);
                break;
            }
            default:
                return response.status(400).end();
        }
    } catch (err) {
        console.log(err)
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
});

exports.stripe_webhook = functions.region('asia-northeast1').https.onRequest(app);