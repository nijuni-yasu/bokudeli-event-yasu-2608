import 'dotenv/config' // cf. https://github.com/firebase/firebase-tools/issues/6499

import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
});

export const { slackbot } = await import('./app.js');
