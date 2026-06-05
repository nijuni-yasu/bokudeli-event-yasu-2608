import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
});

export const { slackbot } = await import('./app.js');
export const { eventNotification } = await import('./event-notification.js');
export const { orderNotification } = await import('./order-notification.js');
