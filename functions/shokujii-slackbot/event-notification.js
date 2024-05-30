import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dateFns from 'date-fns';

const db = getFirestore();

const notSend = false;

const makeNotificationOrderMessage = (eventName, beforeDays) => {
  return beforeDays > 0
    ? `${eventName} の食事会が注文期限${beforeDays}日前となりました。忘れずに注文しよう！`
    : `${eventName} の食事会が注文が確定しました。参加者はこちらのみなさんです。当日をお楽しみに！`
}

const makeEventStartMessage = (eventName, minutes) => {
  return `${eventName} の食事会が開始${minutes}分前になりました。`
}

const makeEventEndMessage = (eventName) => {
  return `${eventName} の食事会が終了しました。次回開催をお楽しみに！`
}

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

const getCommunityBots = async (communityId) => {
  const bots = await db.collection('communities').doc(communityId).collection('bots').get();
  return bots.docs.map(bot => bot.data());
}

const notificationOrder = async (start, end, beforeDays) => {
  // 注文期限3日前	「XXXXX の食事会が注文期限3日前となりました。忘れずに注文しよう！」
  // 注文期限1日前	「XXXXX の食事会が注文期限1日前となりました。忘れずに注文しよう！」
  // 注文期限	「XXXXX の食事会が注文が確定しました。参加者はこちらのみなさんです。当日をお楽しみに！」
  const startAddedDays = start + beforeDays * 24 * 60 * 60 * 1000;
  const endAddedDays = end + beforeDays * 24 * 60 * 60 * 1000;
  const events = await (db.collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(startAddedDays))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(endAddedDays))
    .get())

  Promise.all(events.docs.map(async (eventSnapshot) => {
    const eventData = eventSnapshot.data();
    const eventName = eventData.event_name;

    const bots = await getCommunityBots(eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      switch (botData.type) {
        case 'slack':
          await sendSlackMessage(botData, makeNotificationOrderMessage(eventName, beforeDays));
        default:
          break;
      }
    }));
  }));
}

const notificationEventStart = async (start, end, beforeMinutes) => {
  // 開始時刻15分前	「XXXXX の食事会が開始15分前になりました。」
  const startAddedMinutes = start + beforeMinutes * 60 * 1000;
  const endAddedMinutes = end + beforeMinutes  * 60 * 1000;
  const events = await (db.collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_start_datetime', '>', Timestamp.fromMillis(startAddedMinutes))
    .where('event_start_datetime', '<=', Timestamp.fromMillis(endAddedMinutes))
    .get());

  Promise.all(events.docs.map(async (eventSnapshot) => {
    const eventData = eventSnapshot.data();
    const eventName = eventData.event_name;

    const bots = await getCommunityBots(eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      switch (botData.type) {
        case 'slack':
          await sendSlackMessage(botData, makeEventStartMessage(eventName, beforeMinutes));
        default:
          break;
      }
    }));
  }));
}

const notificationEventEnd = async (start, end) => {
  // 終了時刻	「XXXXX の食事会が終了しました。次回開催をお楽しみに！」
  const events = await (db.collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_end_datetime', '>', Timestamp.fromMillis(start))
    .where('event_end_datetime', '<=', Timestamp.fromMillis(end))
    .get());

  Promise.all(events.docs.map(async (eventSnapshot) => {
    const eventData = eventSnapshot.data();
    const eventName = eventData.event_name;

    const bots = await getCommunityBots(eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      switch (botData.type) {
        case 'slack':
          await sendSlackMessage(botData, makeEventEndMessage(eventName));
        default:
          break;
      }
    }));
  }));

}

export const eventNotification = functions
  .region('asia-northeast1')
  .pubsub
  .schedule('*/1 * * * *') // .schedule('every 1 minutes')
  .onRun(async (event) => {
    const now = dateFns.parseISO(event.timestamp).getTime();
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000;
    const start = end - (60 * 1000);
    return Promise.all([
      notificationOrder(start, end, 3),
      notificationOrder(start, end, 1),
      notificationOrder(start, end, 0),
      notificationEventStart(start, end, 15),
      notificationEventEnd(start, end),
    ]);
  });

export const notificationTest = functions
.region('asia-northeast1')
.https
.onRequest(async (req, res) => { 
  const botDataList = await getCommunityBots('5oxesNeS5dO078qABR98');
  console.debug(botDataList);

  const eventName = 'テストイベント';
  Promise.all(botDataList.map(async (botData) => {
    await sendSlackMessage(botData, makeNotificationOrderMessage(eventName, 3));
  }))

  const now = Date.now();
  const end = Math.trunc(now / 60 / 1000) * 60 * 1000;
  const start = end - (60 * 1000);

  // notificationOrder(start, end, 3);
  res.send('ok');
});
