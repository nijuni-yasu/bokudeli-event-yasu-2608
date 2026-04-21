import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { sendMessage, getEventUrl, getUserUrl } from './utils/bot-utils.js'

const db = getFirestore()

/** 同一バッチの複数 member_order を1通知にまとめる窓（仕様: 15_EventMemberOrder_SlackBot.md） */
const AGGREGATION_WINDOW_MS = 5000

// 注文参加	「OOOさんが、XXXXの食事会で、△△△を注文したよ！」（複数メニューは集約）
// ドキュメント更新

const sendOrderedMessage = async (afterSnapshot, eventRef) => {
  const memberOrdersCol = afterSnapshot.ref.parent
  // 実行遅延が数秒以上あっても取りこぼさないよう、窓の基準は Date.now ではなく本ドキュメントの updated_at とする
  const anchor = afterSnapshot.get('updated_at')
  const anchorMillis = anchor instanceof Timestamp ? anchor.toMillis() : Date.now()
  const threshold = Timestamp.fromMillis(anchorMillis - AGGREGATION_WINDOW_MS)
  const recentOrdered = await memberOrdersCol
    .where('status', '==', 'ordered')
    .where('updated_at', '>', threshold)
    .get()

  const docs = recentOrdered.docs.slice().sort((a, b) => a.id.localeCompare(b.id))
  if (docs.length === 0 || docs[0].id !== afterSnapshot.id) {
    return
  }

  const menuCounts = {}
  const menuNameOrder = []
  for (const doc of docs) {
    const name = doc.get('menu_name')
    if (name == null || name === '') continue
    if (menuCounts[name] === undefined) {
      menuCounts[name] = 0
      menuNameOrder.push(name)
    }
    menuCounts[name] += 1
  }

  const menuPhrase = menuNameOrder
    .map((name) => {
      const count = menuCounts[name]
      return count === 1 ? name : `${name}×${count}`
    })
    .join(' と ')

  if (menuPhrase === '') {
    console.warn('orderNotification: no menu_name in aggregation window', { orderId: afterSnapshot.id })
    return
  }

  const communityRef = eventRef.parent.parent

  const communityBotSnapshot = await communityRef.collection('bots').get()
  if (communityBotSnapshot.empty) {
    console.log('No bots found')
    return
  }

  const userId = afterSnapshot.get('user_id')

  const [eventSnapshot, userSnapshot] = await Promise.all([eventRef.get(), db.collection('users').doc(userId).get()])

  const eventData = eventSnapshot.data()
  const eventName = eventData.event_name
  const eventUrl = getEventUrl(eventData.community_account, eventData.event_id)
  const userName = userSnapshot.get('user_name')
  const userUrl = getUserUrl(userId)

  const botDataList = communityBotSnapshot.docs.map((doc) => doc.data())
  const message = `<${userUrl}|${userName}> さんが、<${eventUrl}|${eventName}> で、${menuPhrase} を注文したよ！`

  await Promise.all(botDataList.map((botData) => sendMessage(botData, message)))
}

export const orderNotification = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/events/{eventId}/members/{memberId}/member_orders/{orderId}')
  .onWrite(async (change) => {
    const before = change.before
    const after = change.after
    if (!after.exists) {
      return
    }
    if (before.get('status') === after.get('status') || after.get('status') !== 'ordered') {
      return
    }

    const eventRef = after.ref.parent.parent.parent.parent

    return sendOrderedMessage(after, eventRef)
  })
