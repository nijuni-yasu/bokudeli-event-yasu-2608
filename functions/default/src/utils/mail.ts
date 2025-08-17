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
  // community_account と community_id の両方に対応
  const communityId = event.community_id || event.community_account
  const emailSet = await getCommunityManagerEmailSet(communityId)

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
