import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dateFns from 'date-fns';
import ja from 'date-fns/locale/ja';
import sgMail from '@sendgrid/mail';

// 環境変数の方がよいかもしれない
const DEFAULT_FROM = '食事でつながるshokujii<shokujii@nijuni.jp>';
const DEFAULT_CC = 'support+cc@nijuni.jp';
const DEFAULT_TO = 'support+to@nijuni.jp';

const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e';
const APPLYING_ORDER_TEMPLATE_ID = 'd-a0eeb84707604e658dc4aabb38f1b92d';
const DELIVERY_DURATION = 30; // minutes

const EVENT_INFORMATION_TEMPLATE_ID = 'd-32df61e4ef334bf4a3a6071096679864';
const EVENT_CONFIRMATION_TEMPLATE_ID = 'd-2fea06c315a240d2becd864b54f38098';
// 環境変数の方がよいかもしれない
const EVENT_INFORMATION_UNSUBSCRIBE_GROUP = 25345;

const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7';
const EVENT_STATUS_IN_DRAFT_ID = 'd-db07a084839741ada6e3ff0f44ac3b41';
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c';
const COMMUNITY_CONTACT_ID = 'd-940c5bd81040475e8c9522c80e361433';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const db = getFirestore();

/**
 *
 * @param {number} millis UNIX Time （ミリ秒）
 * @returns 日本時間を表示するためのミリ秒
 */
function convertToJapan(millis) {
    if (millis == null) {
        return undefined;
    }
    // date-fns-tz は単純にタイムゾーンのオフセットを追加した Date を作成するだけなので、今回は単純加算で対応する
    // TODO サマータイムがあるような地域に進出した場合は、何らかの措置を考えなければいけない
    // https://qiita.com/suin/items/296740d22624b530f93a#utc%E3%81%AAdate%E3%82%92asiatokyo%E3%81%AE%E6%97%A5%E6%99%82%E3%81%AB%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%99%E3%82%8B
    return millis + 9 * 60 * 60 * 1000;
}

function convertToDate(millis) {
    if (millis == null) {
        return undefined;
    }
    return dateFns.format(
        millis,
        'yyyy/MM/dd (eee)',
        { locale: ja }
    );
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

function getCommunityUrl(communityAccount) {
    return `https://${process.env.EVENT_HOST}/c/${communityAccount}`;
}

function getEventUrl(communityAccount, eventId) {
    return `https://${process.env.EVENT_HOST}/c/${communityAccount}/e/${eventId}`;
}

function getOrderUrl(eventId) {
    return `https://${process.env.ADMIN_HOST}/order/${eventId}`;
}

async function getShopForEvent(eventSnapshot) {
    const shopId = eventSnapshot.get('shop_id');
    const partnerId = eventSnapshot.get('partner_id');
    const shopRef = db.collection('partners').doc(partnerId).collection('shops').doc(shopId);
    return await shopRef.get();
}

function getShopEmails(shopSnapshot) {
    const emails = new Set();
    for (const field of ['shop_email', 'shop_email_sub1', 'shop_email_sub2', 'shop_email_sub3']) {
        const mail = shopSnapshot.get(field)
        if (mail != null && mail !== '') {
            emails.add(mail);
        }
    }
    return Array.from(emails);
}

async function getCommunityManagerEmailsSet(communityId) {
    // 重複するメールアドレスは追加しない
    const emails = new Set();
    const membersRef = db.collection('communities').doc(communityId).collection('members');
    const membersSnapshot = await membersRef.get();
    await Promise.all(membersSnapshot.docs.map(async (member) => {
        const roles = member.get('roles')
        if ((roles instanceof Array) && roles.includes('manager')) {
            const userRef = db.collection('users').doc(member.id);
            const userSnapshot = await userRef.get();
            const userEmail = userSnapshot.get('user_email');
            if (userEmail != null && userEmail !== '') {
                emails.add(userEmail);
            }
        }
    }));
    return emails;
}

async function getCommunityEmailsForEvent(eventSnapshot) {
    const communityId = eventSnapshot.ref.parent.parent.id;
    const emails = await getCommunityManagerEmailsSet(communityId);

    const organizerEmail = eventSnapshot.get('organizer_email');
    if (organizerEmail != null && organizerEmail !== '') {
        emails.add(organizerEmail);
    }
    return Array.from(emails);
}

async function getEventMemberEmails(eventSnapshot) {
    const usersSet = await getUsersFromOrders(eventSnapshot.ref.collection('orders'));
    return await Promise.all(Array.from(usersSet).map(async (userId) => {
        const userRef = db.collection('users').doc(userId);
        const userSnapshot = await userRef.get();
        return userSnapshot.get('user_email');
    }));
}

async function getCommunityEmails(communityId) {
    const emails = await getCommunityManagerEmailsSet(communityId);
    if (emails.size === 0) {
        // コミュマネがいない場合はsupport+to@nijuni.jpに送信
        emails.add(DEFAULT_TO);
    }
    return Array.from(emails);
}

async function createOrdersForOrderDeadline(ordersRef) {
    const promises = [];
    const orders = [];
    let count = 0;
    let price = 0;
    for (const orderRef of await ordersRef.listDocuments()) {
        const orderSnapshot = await orderRef.get();
        if (orderSnapshot.get('status') !== 'ordered') {
            continue;
        }
        const userRef = db.collection('users').doc(orderSnapshot.get('user_id'));
        for (const menu of orderSnapshot.get('menus') ?? []) {
            const promise = userRef.get().then(userSnapshot => {
                for (let i = 0; i < menu.count; i++) {
                    orders.push({
                        name: userSnapshot.get('user_name'),
                        order: menu.name,
                        price: `¥${menu.price}`
                    });
                    count++;
                    price += menu.price;
                }
            });
            promises.push(promise);
        }
    }
    await Promise.all(promises);
    orders
        .sort((a, b) => a.order > b.order ? 1 : a.order < b.order ? -1 : 0)
        .forEach((order, i) => order.number = i + 1);
    return [count, price, orders];
}

async function createTemplateDataForOrderDeadline(eventSnapshot) {
    const ordersRef = eventSnapshot.ref.collection('orders');
    const [order_count, order_total_price, orders] = await createOrdersForOrderDeadline(ordersRef);
    const eventData = eventSnapshot.data();
    const event_start_datetime_japan = convertToJapan(eventData.event_start_datetime?.toMillis());
    const date = convertToDate(event_start_datetime_japan)
    const deliveryDuration = convertToDuration(event_start_datetime_japan - DELIVERY_DURATION * 60 * 1000, event_start_datetime_japan)
    const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`;
    const event_deadline_datetime = convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis()));

    return {
        ...eventData,
        date,
        delivery_date,
        event_deadline_datetime,
        order_count,
        order_total_price,
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
        orders,
        order_url: getOrderUrl(eventSnapshot.id),
    };
}

async function sendOrderDeadlineMailToShop(start, end, is_reminder) {
    const events = await (db.collectionGroup('events')
        .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
        .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
        .where('event_status.value', '==', 'accepting_order')).get();
    return Promise.all(events.docs.map(async (eventSnapshot) => {
        try {
            const [dynamic_template_data, shopSnapShot] = await Promise.all([
                createTemplateDataForOrderDeadline(eventSnapshot),
                getShopForEvent(eventSnapshot),
            ]);
            dynamic_template_data.is_reminder = is_reminder;
            await sgMail.send({
                to: getShopEmails(shopSnapShot),
                from: DEFAULT_FROM,
                cc: DEFAULT_CC,
                templateId: ORDER_DEADLINE_TEMPLATE_ID,
                dynamic_template_data,
            });
        } catch (err) {
            console.warn(err);
        }
    }));
}

async function sendOrderDeadlineMailToMembers(start, end) {
    const events = await (db.collectionGroup('events')
        .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
        .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
        .where('event_status.value', '==', 'accepting_order')).get();
    return Promise.all(events.docs.map(async (eventSnapshot) => {
        const eventData = eventSnapshot.data();
        const dynamic_template_data = {
            date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
            event_datetime: convertToDuration(convertToJapan(eventData.event_start_datetime?.toMillis()), convertToJapan(eventData.event_end_datetime?.toMillis())),
            event_name: eventData.event_name,
            event_cover_url: eventData.event_cover_url,
            community_name: eventData.community_name,
            event_address: eventData.event_address,
            shop_name: eventData.shop_name,
            event_url: getEventUrl(eventData.community_account, eventSnapshot.id)
        }
        try {
            await Promise.all((await getEventMemberEmails(eventSnapshot)).map(async (to) => {
                await sgMail.send({
                    to,
                    from: DEFAULT_FROM,
                    templateId: EVENT_CONFIRMATION_TEMPLATE_ID,
                    dynamic_template_data,
                });
            }));
        } catch (err) {
            console.warn(err);
        }
    }));
}

async function sendApplyingOrderMail(eventSnapshot) {
    const [dynamic_template_data, shopSnapShot] = await Promise.all([
        createTemplateDataForOrderDeadline(eventSnapshot),
        getShopForEvent(eventSnapshot),
    ]);
    return sgMail.send({
        to: getShopEmails(shopSnapShot),
        from: DEFAULT_FROM,
        cc: DEFAULT_CC,
        templateId: APPLYING_ORDER_TEMPLATE_ID,
        dynamic_template_data,
    });
}

async function getUsersFromOrders(ordersRef) {
    const users = new Set();
    for (const orderRef of await ordersRef.listDocuments()) {
        const orderSnapshot = await orderRef.get();
        users.add(orderSnapshot.get('user_id'));
    }
    return users;
}

async function createTemplateDataForEventInformation(targetDateTimeMillis) {
    const date = dateFns.format(
        convertToJapan(targetDateTimeMillis),
        'MM/dd',
        { locale: ja }
    );
    const _dynamic_template_data = {
        date,
        events: []
    };
    const query = db.collectionGroup('events')
        .where('is_public', '==', true)
        .where('event_status.value', '==', 'accepting_order')
        .where('event_deadline_datetime', '>', Timestamp.fromMillis(targetDateTimeMillis));
    // 不等号を含む where がある場合、他のフィールドでソートできない
    // https://firebase.google.com/docs/firestore/query-data/order-limit-data#limitations
    // .orderBy('event_start_datetime')
    const eventsSnapshot = (await query.get()).docs
        .sort((a, b) => {
            const aTime = a.get('event_start_datetime');
            const bTime = b.get('event_start_datetime');
            return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
        });
    for (const eventSnapshot of eventsSnapshot) {
        const ordersRef = eventSnapshot.ref.collection('orders');
        const users = await getUsersFromOrders(ordersRef);
        if (users.size < eventSnapshot.get('event_max_people')) {
            const eventData = eventSnapshot.data();
            const event_datetime = convertToDuration(
                convertToJapan(eventData.event_start_datetime?.toMillis()),
                convertToJapan(eventData.event_end_datetime?.toMillis()));
            const event_deadline_datetime = convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis()));
            _dynamic_template_data.events.push({
                event_name: eventData.event_name,
                event_address: eventData.event_address,
                event_datetime,
                event_deadline_datetime,
                event_desc: eventData.event_desc,
                event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
                event_cover_url: eventData.event_cover_url,
                shop_name: eventData.shop_name,
                community_name: eventData.community_name,
            });
            if (_dynamic_template_data.events.length === 3) {
                break;
            }
        }
    }
    return _dynamic_template_data;
}

async function sendEventInformationMail() {
    const nowDateTimeMillis = Date.now();
    const _dynamic_template_data = await createTemplateDataForEventInformation(nowDateTimeMillis);
    if (_dynamic_template_data.events.length === 0) {
        return;
    }
    const promises = [];
    for (const userRef of await db.collection('users').listDocuments()) {
        const userSnapshot = await userRef.get();
        const dynamic_template_data = {
            ..._dynamic_template_data,
            user_name: userSnapshot.get('user_name')
        };
        promises.push(sgMail.send({
            to: userSnapshot.get('user_email'),
            from: DEFAULT_FROM,
            templateId: EVENT_INFORMATION_TEMPLATE_ID,
            dynamic_template_data,
            asm: {
                groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
            }
        }).catch(err => {
            console.warn(err);
        }));
    }
    return Promise.all(promises);
    // エミュレータからのテストメール
    // const dynamic_template_data = {
    //     ..._dynamic_template_data,
    //     user_name: 'テストユーザー'
    //   };
    // sgMail.send({
    //     to: 'yasukawa.naohiro+test@nijuni.jp',
    //     from: DEFAULT_FROM,
    //     templateId: EVENT_INFORMATION_TEMPLATE_ID,
    //     dynamic_template_data,
    //     asm: {
    //         groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
    //     }
    // });
}

async function sendEventInformationMailPreview() {
    const tomorrowDateTimeMillis = Date.now() + 24 * 60 * 60 * 1000;
    const _dynamic_template_data = await createTemplateDataForEventInformation(tomorrowDateTimeMillis);
    if (_dynamic_template_data.events.length === 0) {
        return sgMail.send({
            to: DEFAULT_TO,
            from: DEFAULT_FROM,
            subject: '【プレビュー】明日のイベント情報について',
            text: '明日送信予定のイベント予定はありません'
        });
    }
    const dynamic_template_data = {
        ..._dynamic_template_data,
        user_name: 'テストユーザー',
    };
    return sgMail.send({
        to: DEFAULT_TO,
        from: DEFAULT_FROM,
        templateId: EVENT_INFORMATION_TEMPLATE_ID,
        dynamic_template_data,
        asm: {
            groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
        }
    })
}

async function sendEventStatusMail(templateId, eventSnapshot) {
    const [templateData, shopSnapShot, to] = await Promise.all([
        createTemplateDataForOrderDeadline(eventSnapshot),
        getShopForEvent(eventSnapshot),
        getCommunityEmailsForEvent(eventSnapshot),
    ]);
    const dynamic_template_data = {...templateData, ...shopSnapShot.data()}
    return sgMail.send({
        to,
        from: DEFAULT_FROM,
        cc: DEFAULT_CC,
        templateId,
        dynamic_template_data,
    });
}

async function sendShopOpenMail(shopSnapshot) {
    const shopName = shopSnapshot.get('shop_name');
    const isOpen = shopSnapshot.get('is_open') ? '開店（OPEN）' : '閉店（CLOSE）';
    const subject =  `${shopName}の開店設定が変更されました`;
    // TODO これ以上複雑になるようなら、テンプレートを使う
    const text = `${shopName}の開店設定が『${isOpen}』になりました\n\n` +
        `【店舗名】${shopName}\n` +
        `【店舗住所】${shopSnapshot.get('shop_address')}\n` +
        `【PartnerID】${shopSnapshot.get('partner_id')}\n` +
        `【開店設定】${isOpen}`
    return sgMail.send({
        to: DEFAULT_CC,
        from: DEFAULT_FROM,
        subject,
        text,
    });
}

async function sendNewCommunityRequestMail(communitySnapshot) {
    const communityId = communitySnapshot.id;
    const communityName = communitySnapshot.get('community_name');
    const communityAccount = communitySnapshot.get('community_account');
    // TODO これ以上複雑になるようなら、テンプレートを使う
    const subject = `「${communityName}」コミュニティが新規申請されました`;
    const text = `【ID】 ${communityId}\n` +
        `【コミュニティ名】 ${communityName}\n` +
        `【コミュニティアカウント】 ${communityAccount}\n` +
        `【コミュニティページURL】 ${getCommunityUrl(communityAccount)}`
    return sgMail.send({
        to: DEFAULT_TO,
        from: DEFAULT_FROM,
        subject,
        text,
    })
}

async function sendCommunityContactMail(templateId, data) {
    const to =  await getCommunityEmails(data.community_id)
    const dynamic_template_data = data
    return sgMail.send({
        to,
        from: DEFAULT_FROM,
        cc: DEFAULT_CC,
        templateId,
        dynamic_template_data,
    });
}

export const polling = functions
    .region('asia-northeast1')
    .pubsub
    .schedule('*/1 * * * *') // .schedule('every 1 minutes')
    .onRun(async (event) => {
        const now = dateFns.parseISO(event.timestamp).getTime();
        // 秒を無視しないと誤差で実行できないケースがでてきてしまう
        const end = Math.trunc(now / 60 / 1000) * 60 * 1000;
        const start = end - (60 * 1000);
        return Promise.all([
            sendOrderDeadlineMailToShop(start, end, false),
            sendOrderDeadlineMailToShop(start + 24 * 60 * 60 * 1000, end + 24 * 60 * 60 * 1000, true),
            sendOrderDeadlineMailToMembers(start, end),
        ]);
    });

export const event_information = functions
    .region('asia-northeast1')
    .pubsub
    .schedule('0 10 * * 1')
    .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
    .onRun(() => {
        return sendEventInformationMail();
    })

export const event_information_preview = functions
    .region('asia-northeast1')
    .pubsub
    .schedule('0 10 * * 0')
    .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
    .onRun(() => {
        return sendEventInformationMailPreview();
    })


export const on_event_changed = functions
    .region('asia-northeast1')
    .firestore
    .document('communities/{communityId}/events/{eventId}')
    .onUpdate(async (change) => {
        const conditions = [
            ['in_draft', 'applying_reservation', sendApplyingOrderMail],
            ['in_draft', 'applying_reservation', sendEventStatusMail.bind(null, EVENT_STATUS_APPLYING_RESERVATION_ID)],
            ['applying_reservation', 'in_draft', sendEventStatusMail.bind(null, EVENT_STATUS_IN_DRAFT_ID)],
            ['applying_reservation', 'accepting_order', sendEventStatusMail.bind(null, EVENT_STATUS_ACCEPTING_ORDER_ID)],
        ]
        const before = change.before;
        const after = change.after;
        const promises = [];
        for (const c of conditions) {
            if (before.get('event_status')?.value === c[0] && after.get('event_status')?.value === c[1]) {
                promises.push(c[2](after));
            }
        }
        return Promise.all(promises);
    });

export const on_shop_changed = functions
    .region('asia-northeast1')
    .firestore
    .document('partners/{partnerId}/shops/{shopId}')
    .onWrite(async (change) => {
        const before = change.before;
        const after = change.after;
        const promises = [];
        if (after.get('is_open') != null && before.get('is_open') !== after.get('is_open')) {
            promises.push(sendShopOpenMail(after));
        }
        return Promise.all(promises);
    });

export const community_added = functions
    .region('asia-northeast1')
    .firestore
    .document('communities/{communityId}')
    .onCreate(async (snapshot) => {
        return sendNewCommunityRequestMail(snapshot);
    })

export const community_contact = functions
    .region('asia-northeast1')
    .https
    .onCall((data, context) => {
        if (context.auth) {
            return sendCommunityContactMail(COMMUNITY_CONTACT_ID, data);
        } else {
            console.log('community_contact Auth Error')
            console.log(data)
            console.log(context)
            throw new functions.https.HttpsError('permission-denied', 'community_contact Auth Error');
        }
    })
