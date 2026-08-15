import { Timestamp } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getEventInCommunity } from './stores/event.js'
import { getRecentOrderedOrdersForMember } from './stores/memberOrder.js'
import { getCommunityBots } from './stores/slackBot.js'
import { getUser } from './stores/user.js'
import { getEventUrl, getUserUrl } from './utils/urls.js'
import { sendCommunityBotsMessageOrThrow } from './utils/slackMessage.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('slackOrderNotification')

/** 同一バッチの複数 member_order を1通知にまとめる窓（仕様: 15_EventMemberOrder_SlackBot.md） */
const AGGREGATION_WINDOW_MS = 5000

const sendOrderedMessage = async (params: {
  communityId: string
  eventId: string
  memberId: string
  orderId: string
  updatedAt: Timestamp | number | undefined
}): Promise<void> => {
  const { communityId, eventId, memberId, orderId, updatedAt } = params
  const anchorMillis =
    updatedAt instanceof Timestamp ? updatedAt.toMillis() : typeof updatedAt === 'number' ? updatedAt : Date.now()
  const thresholdMillis = anchorMillis - AGGREGATION_WINDOW_MS

  const recentOrdered = await getRecentOrderedOrdersForMember(communityId, eventId, memberId, thresholdMillis)
  const sorted = [...recentOrdered].sort((a, b) => a.id.localeCompare(b.id))
  if (sorted.length === 0 || sorted[0]?.id !== orderId) {
    return
  }

  const menuCounts: Record<string, number> = {}
  const menuNameOrder: string[] = []
  for (const order of sorted) {
    const name = order.menu_name
    if (name === '') continue
    if (menuCounts[name] === undefined) {
      menuCounts[name] = 0
      menuNameOrder.push(name)
    }
    menuCounts[name] += 1
  }

  const menuPhrase = menuNameOrder
    .map((name) => {
      const count = menuCounts[name] ?? 0
      return count === 1 ? name : `${name}×${count}`
    })
    .join(' と ')

  if (menuPhrase === '') {
    logger.warn('slackOrderNotification: no menu_name in aggregation window', { orderId })
    return
  }

  const bots = await getCommunityBots(communityId)
  if (bots.length === 0) {
    logger.info('No bots found', { communityId })
    return
  }

  const userId = sorted[0]?.user_id ?? memberId
  const [event, user] = await Promise.all([getEventInCommunity(communityId, eventId), getUser(userId, false)])

  if (event == null || user == null) {
    logger.warn('Event or user not found for order notification', { communityId, eventId, userId })
    return
  }

  const eventUrl = getEventUrl(event.community_account, event.id)
  const userUrl = getUserUrl(userId)
  const message = `<${userUrl}|${user.user_name}> さんが、<${eventUrl}|${event.event_name}> で、${menuPhrase} を注文したよ！`

  await sendCommunityBotsMessageOrThrow(communityId, bots, message)
}

/** legacy orderNotification から移行。export 名を Slack 専用に変更。 */
export const slackOrderNotification = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/members/{memberId}/member_orders/{orderId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    const before = event.data?.before
    const after = event.data?.after
    if (after == null || !after.exists) {
      return
    }

    const beforeStatus = before?.exists ? before.get('status') : undefined
    const afterStatus = after.get('status')
    if (beforeStatus === afterStatus || afterStatus !== 'ordered') {
      return
    }

    const { communityId, eventId, memberId, orderId } = event.params
    await sendOrderedMessage({
      communityId,
      eventId,
      memberId,
      orderId,
      updatedAt: after.get('updated_at') as Timestamp | number | undefined,
    })
  },
)
