const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * 
 * @param {number} millis UNIX Time （ミリ秒）
 * @returns 日本時間を表示するためのミリ秒
 */
function convertToJapan(millis) {
    // date-fns-tz は単純にタイムゾーンのオフセットを追加した Date を作成するだけなので、今回は単純加算で対応する
    // TODO サマータイムがあるような地域に進出した場合は、何らかの措置を考えなければいけない
    // https://qiita.com/suin/items/296740d22624b530f93a#utc%E3%81%AAdate%E3%82%92asiatokyo%E3%81%AE%E6%97%A5%E6%99%82%E3%81%AB%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%99%E3%82%8B
    return millis + 9 * 60 * 60 * 1000;
}

const dateFns = require('date-fns');
const ja = require('date-fns/locale/ja');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 環境変数の方がよいかもしれない
const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e';
const DELIVERY_DURATION = 30; // minutes

function getEventUrl(communityAccount, eventId) {
    return `https://${process.env.EVENT_HOST}/community/${communityAccount}/events/${eventId}`;
}

async function getShopEmails(eventSnapshot) {
    const emails = [];
    const partnerId = eventSnapshot.get('partner_id');
    const shopsRef = db.collection('partners').doc(partnerId).collection('shops');
    for (const shopRef of await shopsRef.listDocuments()) {
        emails.push((await shopRef.get()).get('shop_email'));
    }
    return emails;
}

async function createOrdersForOrderDeadline(ordersRef) {
    const promises = [];
    const orders = [];
    let count = 0;
    let price = 0;
    for (const orderRef of await ordersRef.listDocuments()) {
        const orderSnapshot = await orderRef.get();
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
    let date = undefined;
    let delivery_date = undefined;
    const event_start_datetime = eventData.event_start_datetime?.toMillis();
    if (event_start_datetime != null) {
        const event_start_datetime_japan = convertToJapan(event_start_datetime);
        date = dateFns.format(event_start_datetime_japan, 'yyyy/MM/dd (eee)', { locale: ja });
        const delivery_date_start = dateFns.format(
            event_start_datetime_japan - DELIVERY_DURATION * 60 * 1000,
            'yyyy/MM/dd (eee) HH:mm',
            { locale: ja }
        );
        const delivery_date_end = dateFns.format(
            event_start_datetime_japan,
            'HH:mm'
        );
        delivery_date = `${delivery_date_start}〜${delivery_date_end} （※${DELIVERY_DURATION}分の配達時間をいただいています）`;
    }
    let event_deadline_datetime = undefined;
    const event_deadline_datetime_millis = eventData.event_deadline_datetime?.toMillis();
    if (event_deadline_datetime_millis != null) {
        event_deadline_datetime = dateFns.format(
            convertToJapan(event_deadline_datetime_millis),
            'yyyy/MM/dd (eee) HH:mm',
            { locale: ja }
        );
    }
    
    return {
        date,
        delivery_date,
        shop_name: eventData.shop_name,
        event_name: eventData.event_name,
        event_address: eventData.event_address,
        event_deadline_datetime,
        order_count,
        order_total_price,
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
        //     organizer_company: eventData.organizer_company,
        //     organizer_fullname: eventData.organizer_fullname,
        //     organizer_phone_personal: eventData.organizer_phone_personal,
        //     organizer_phone_company: eventData.organizer_company,
        //     organizer_email: eventData.organizer_email,
        //     organizer_memo: eventData.organizer_memo,
        orders,
    };
}

async function sendOrderDeadlineMail(start, end, is_reminder) {
    const promises = [];
    const query = db.collectionGroup('events')
        .where('event_deadline_datetime', '>', new Date(start))
        .where('event_deadline_datetime', '<=', new Date(end));
    (await query.get()).forEach(async (eventSnapshot) => {
        try {
            const event_deadline_datetime = eventSnapshot.get('event_deadline_datetime');
            const deadline = event_deadline_datetime?.toMillis() ?? 0;
                            if (start < deadline && deadline <= end) {
                const [to, dynamic_template_data] = await Promise.all([
                    getShopEmails(eventSnapshot),
                    createTemplateDataForOrderDeadline(eventSnapshot)
                ]);
                dynamic_template_data.is_reminder = is_reminder;
                promises.push(sgMail.send({
                    to,
                    from: 'bokudeli@nijuni.jp',
                    cc: 'support@nijuni.jp',
                    bcc: 'yasukawa.naohiro@nijuni.jp',
                    templateId: ORDER_DEADLINE_TEMPLATE_ID,
                    dynamic_template_data,
                }));
            }
        } catch (err) {
            console.warn(err);
        }
    });
    return Promise.all(promises);
}

exports.polling = functions
    .region('asia-northeast1')
    .pubsub
    .schedule('*/1 * * * *') // .schedule('every 1 minutes')
    .onRun(async (event) => {
        const now = dateFns.parseISO(event.timestamp).getTime();
        // 秒を無視しないと誤差で実行できないケースがでてきてしまう
        const end = Math.trunc(now / 60 / 1000) * 60 * 1000;
        const start = end - (60 * 1000);
        return Promise.all([
            sendOrderDeadlineMail(start, end, false),
            sendOrderDeadlineMail(start + 24 * 60 * 60 * 1000, end + 24 * 60 * 60 * 1000, true),
        ]);
    });
