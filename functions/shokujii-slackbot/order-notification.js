import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

const notSend = false;

const sendSlackMessage = async (slackBotData, message) => {
  const teamId = (slackBotData.is_enterprise_install && slackBotData.enterprise_id !== '')
    ? slackBotData.enterprise_id
    : slackBotData.team_id;
  const channelId = slackBotData.channel_id;
  const botDoc = await db.collection('slackbots').doc(teamId).collection('channels').doc(channelId).get();
  const url = botDoc.data().url;
  const slackMessage = {
    channel: channelId,
    text: message,
  }

  console.debug({ url, slackMessage })
  if (notSend) {
    const message = JSON.stringify(slackMessage)
    console.log({ url,  message })
    return;
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackMessage)
  });
}

// 注文参加	「OOOさんが、XXXXの食事会で、△△△を注文したよ！」
// ドキュメント更新

const send_ordered_message = async (orderSnapshot, eventRef) => {
  const communityRef = eventRef.parent.parent;

  const communityBotSnapshot = await communityRef.collection('bots').get();
  if (communityBotSnapshot.empty) {
    console.log('No bots found');
    return;
  }
  const botDataList = communityBotSnapshot.docs.map(doc => doc.data());

  const userId = orderSnapshot.get('user_id');

  const [eventSnapshot, userSnapshot] = await Promise.all([
    eventRef.get(),
    db.collection('users').doc(userId).get(),
  ]);

  const eventName = eventSnapshot.get('event_name');
  const userName = userSnapshot.get('user_name');
  const orderMenu = orderSnapshot.get('menus').at(-1);

  Promise.all(botDataList.map(async (botData) => {
    switch (botData.type) {
      case 'slack':
        await sendSlackMessage(botData, `${userName} さんが、${eventName} で、${orderMenu['name']} を注文したよ！`);
      default:
        break;
    }
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

      return send_ordered_message(after, eventRef);
    }
  });
