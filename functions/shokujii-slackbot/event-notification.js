import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dateFns from 'date-fns';
import { getCommunityBots, sendMessage } from './utils/bot-utils.js';

const db = getFirestore();

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

    const bots = await getCommunityBots(db, eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      await sendMessage(botData, makeNotificationOrderMessage(eventName, beforeDays));
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

    const bots = await getCommunityBots(db, eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      await sendMessage(botData, makeEventStartMessage(eventName, beforeMinutes));
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

    const bots = await getCommunityBots(db, eventData.community_id);
    Promise.all(bots.map(async (botData) => {
      await sendMessage(botData, makeEventEndMessage(eventName));
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
  const botDataList = await getCommunityBots(db, 'IskZzL1mOKkGwNlh3BOE');
  console.debug(botDataList);

  const eventName = 'テストイベント';
  Promise.all(botDataList.map(async (botData) => {
    await sendMessage(botData, makeNotificationOrderMessage(eventName, 3));
  }))

  const now = Date.now();
  const end = Math.trunc(now / 60 / 1000) * 60 * 1000;
  const start = end - (60 * 1000);

  // notificationOrder(start, end, 3);
  res.send('ok');
});
