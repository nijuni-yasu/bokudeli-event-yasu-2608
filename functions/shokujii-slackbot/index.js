import 'dotenv/config' // cf. https://github.com/firebase/firebase-tools/issues/6499

import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
});

export const { slackbot } = await import('./app.js');
export const { eventNotification } = await import('./event-notification.js');

// TODO 以下の関数を実装する
// 注文参加	「OOOさんが、XXXXの食事会で、△△△を注文したよ！」
// ドキュメント更新
