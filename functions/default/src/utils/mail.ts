import { getCommunity } from '../stores/community.js'
import { getUser, getUserPersonalInformation } from '../stores/user.js'
import { ShokujiiEvent } from '../stores/event.js'

// 環境変数の方がよいかもしれない
export const DEFAULT_FROM = '食事でつながる「shokujii」<shokujii@nijuni.jp>'
export const DEFAULT_TO = 'support+to@nijuni.jp'
export const SUPPORT_MAIL = 'shokujiiサポート<support+cc@nijuni.jp>'
export const SUPPORT_MAIL_ADDRESS = 'support@nijuni.jp'

/**
 * コミュニティマネージャーのメールアドレスを取得
 */
export async function getCommunityManagerEmailSet(communityId: string): Promise<Set<string>> {
  const emailSet = new Set<string>()
  const community = await getCommunity(communityId)
  if (!community) {
    return emailSet
  }

  const members = await community.getMembersByRole('manager')
  await Promise.all(
    members.map(async (member) => {
      const user = await getUser(member.id, true)
      if (user?.user_email) {
        emailSet.add(user.user_email)
      }
    }),
  )
  return emailSet
}

/**
 * イベント関連のメールアドレスを取得（コミュニティマネージャー + 主催者）
 */
export async function getCommunityEmailsForEvent(event: ShokujiiEvent): Promise<string[]> {
  const emailSet = await getCommunityManagerEmailSet(event.community_id)

  if (event.organizer_email) {
    emailSet.add(event.organizer_email)
  }

  return Array.from(emailSet)
}

/**
 * イベントメンバー（注文者）のメールアドレスを取得
 */
export async function getEventMemberEmails(event: ShokujiiEvent): Promise<string[]> {
  const orders = await event.getOrders('ordered')
  const userIds = [...new Set(orders.map((order) => order.user_id))]

  const emails = await Promise.all(
    userIds.map(async (userId) => {
      const userPersonalInfo = await getUserPersonalInformation(userId)
      return userPersonalInfo?.user_email
    }),
  )

  return emails.filter((email): email is string => email != null && email !== '')
}

/**
 * コミュニティメンバー全員のメールアドレスを取得（注文済みユーザーを除外）
 */
export async function getCommunityMemberEmailsExcludingOrdered(event: ShokujiiEvent): Promise<string[]> {
  // コミュニティの取得
  const community = await getCommunity(event.community_id)
  if (!community) {
    return []
  }

  // コミュニティメンバー全員を取得
  const members = await community.getMembers()

  // 注文済みユーザーのIDセットを取得
  const orders = await event.getOrders('ordered')
  const orderedUserIds = new Set(orders.map((order) => order.user_id))

  // 注文済みユーザーを除外してメールアドレスを取得
  const emails = await Promise.all(
    members
      .filter((member) => !orderedUserIds.has(member.id))
      .map(async (member) => {
        const userPersonalInfo = await getUserPersonalInformation(member.id)
        return userPersonalInfo?.user_email
      }),
  )

  return emails.filter((email): email is string => email != null && email !== '')
}
