import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendMessage, getEventUrl } from './utils/bot-utils.js';

const db = getFirestore();

// 注文参加	「OOOさんが、XXXXの食事会で、△△△を注文したよ！」
// ドキュメント更新

const sendOrderedMessage = async (orderSnapshot, eventRef) => {
  const communityRef = eventRef.parent.parent;

  const communityBotSnapshot = await communityRef.collection('bots').get();
  if (communityBotSnapshot.empty) {
    console.log('No bots found');
    return;
  }

  const userId = orderSnapshot.get('user_id');

  const [eventSnapshot, userSnapshot] = await Promise.all([
    eventRef.get(),
    db.collection('users').doc(userId).get(),
  ]);

  const eventData = eventSnapshot.data();
  const eventName = eventData.event_name;
  const eventUrl = getEventUrl(eventData.community_account, eventData.event_id);
  const userName = userSnapshot.get('user_name');
  const orderMenu = orderSnapshot.get('menus').at(-1);

  const botDataList = communityBotSnapshot.docs.map(doc => doc.data());
  Promise.all(botDataList.map(async (botData) => {
    await sendMessage(botData, `${userName} さんが、 <${eventUrl}|${eventName}> で、${orderMenu['name']} を注文したよ！`);
  }));
}

export const orderNotification = functions
  .region('asia-northeast1')
  .firestore
  .document('communities/{communityId}/events/{eventId}/orders/{orderId}')
  .onWrite(async (change) => {
    const before = change.before;
    const after = change.after;
    if (before.get('status') !== after.get('status') && after.get('status') === 'ordered') {
      const eventRef = after.ref.parent.parent;

      return sendOrderedMessage(after, eventRef);
    }
  });
