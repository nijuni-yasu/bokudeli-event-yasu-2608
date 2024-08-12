import 'dotenv/config'
import functions from 'firebase-functions';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { initializeFirestore } from 'firebase-admin/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dateFns from 'date-fns';
import ja from 'date-fns/locale/ja';
import { promises as fs } from 'fs';
import { messagingApi } from '@line/bot-sdk';
const { MessagingApiClient } = messagingApi;

const EVENT_LIMIT = 10;

const app = initializeApp({
  credential: applicationDefault(),
});
initializeFirestore(app, { preferRest: true })

const db = getFirestore();

async function getUsersFromOrders(ordersRef) {
  const users = new Set();
  for (const orderRef of await ordersRef.listDocuments()) {
      const orderSnapshot = await orderRef.get();
      users.add(orderSnapshot.get('user_id'));
  }
  return users;
}

function convertToDuration(startMillis, endMillis) {
  if (startMillis == null || endMillis == null) {
      return undefined;
  }
  const start = dateFns.format(startMillis, 'yyyy/MM/dd (eee) HH:mm', { locale: ja });
  const end = dateFns.format(
      endMillis,
      'HH:mm'
  );
  return `${start}〜${end}`;
}

function convertToJapan(millis) {
  if (millis == null) {
      return undefined;
  }
  // date-fns-tz は単純にタイムゾーンのオフセットを追加した Date を作成するだけなので、今回は単純加算で対応する
  // TODO サマータイムがあるような地域に進出した場合は、何らかの措置を考えなければいけない
  // https://qiita.com/suin/items/296740d22624b530f93a#utc%E3%81%AAdate%E3%82%92asiatokyo%E3%81%AE%E6%97%A5%E6%99%82%E3%81%AB%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%99%E3%82%8B
  return millis + 9 * 60 * 60 * 1000;
}

function convertToDateTime(millis) {
  if (millis == null) {
      return undefined;
  }
  return dateFns.format(
      millis,
      'yyyy/MM/dd (eee) HH:mm',
      { locale: ja }
  );
}

function getEventUrl(communityAccount, eventId) {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}/e/${eventId}?openExternalBrowser=1`;
}

function buildEventContent(event) {
  return {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": event.event_cover_url,
      "size": "full",
      "aspectRatio": "191:100",
      "aspectMode": "cover",
      "action": {
        "type": "uri",
        "uri": event.event_url
      }
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": event.event_name,
          "weight": "bold",
          "size": "xl",
          "wrap": true,
          "maxLines": 2
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "spacing": "sm",
          "contents": [
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "contents": [
                {
                  "type": "icon",
                  "url": "https://static.line-scdn.net/biz-app/edge/manager/img/cardtypemessage/icon_map_marker_alt.png",
                  "scaling": true,
                  "offsetTop": "xs"
                },
                {
                  "type": "text",
                  "text": event.event_address,
                  "wrap": true,
                  "color": "#666666",
                  "size": "sm",
                  "flex": 5,
                  "maxLines": 2
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "contents": [
                {
                  "type": "icon",
                  "url": "https://static.line-scdn.net/biz-app/edge/manager/img/cardtypemessage/icon_clock.png",
                  "scaling": true,
                  "offsetTop": "xs"
                },
                {
                  "type": "text",
                  "text": event.event_datetime,
                  "wrap": true,
                  "color": "#666666",
                  "size": "sm",
                  "flex": 5
                }
              ]
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "link",
          "height": "sm",
          "action": {
            "type": "uri",
            "label": "イベント参加はこちら",
            "uri": event.event_url
          }
        }
      ],
      "flex": 0
    }
  }
}

const buildMessage = (message_data, altText) => {
  let eventMessages = message_data.events.map(event => buildEventContent(event));
  return {
    "type": "flex",
    "altText": altText,
    "contents": {
      "type": "carousel",
      "contents": eventMessages
    }
  }
}

const buildNoticeMessage = async () => {
  try {
    // ファイルの内容を文字列として読み込む
    const jsonString = await fs.readFile('./notice_message.json', 'utf8');
    // 文字列をオブジェクトに変換
    const { text } = JSON.parse(jsonString);
    return text;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ファイルが存在しない場合は空文字列を返す
      return "";
    } else {
      // その他のエラーはそのまま再スロー
      throw error;
    }
  }
}

const broadcastEventMessage = async (message_data) => {
  const notice = await buildNoticeMessage();
  const message = buildMessage(message_data, notice);
  console.debug({ count: message_data.count });
  console.debug(JSON.stringify(message));
  const client = new MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });
  await client.broadcast({
    messages: notice ? [ { type: "text", text: notice }, message] : [message],
  });
}

async function broadcastEventConcludedMessage() {
  const nowDateTimeMills = Date.now();

  const message_data = { count: 0, events: [] };
  const query = db.collectionGroup('events')
    .where('is_public', '==', true)
    .where('event_status.value', '==', 'accepting_order')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMills));

  const eventsSnapshot = (await query.get()).docs
    .sort((a, b) => {
      const aTime = a.get('event_start_datetime');
      const bTime = b.get('event_start_datetime');
      return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
    });
  for (const eventSnapshot of eventsSnapshot) {
    const ordersRef = eventSnapshot.ref.collection('orders');
    const users = await getUsersFromOrders(ordersRef);
    if (users.size >= eventSnapshot.get('event_max_people')) {
      continue;
    }

    if (message_data.events.length <= EVENT_LIMIT) {
      const eventData = eventSnapshot.data();
      const event_datetime = convertToDuration(
          convertToJapan(eventData.event_start_datetime?.toMillis()),
          convertToJapan(eventData.event_end_datetime?.toMillis()));
        message_data.events.push({
          event_name: eventData.event_name,
          event_address: eventData.event_address,
          event_datetime,
          event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
          event_cover_url: eventData.event_cover_url,
      });
    }
    message_data.count++;
  }

  broadcastEventMessage(message_data);
}

export const broadcast_event_message_request = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    await Promise.all([
      broadcastEventConcludedMessage(),
    ]);   
    return res.status(200).send('OK'); 
  })

export const line_event_information = functions
  .region('asia-northeast1')
  .pubsub
  .schedule('0 18 * * 0') // 日曜日の18時
  .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
  .onRun(() => {
      return Promise.all([broadcastEventConcludedMessage()]);
  })
