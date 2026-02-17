import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore, Transaction } from 'firebase-admin/firestore'
import { sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'
import { convertToDateWeekdayShort, convertToDate } from '@shokujii/common/utils/datetime.js'
import { getCommunity, getCommunityByAccount } from './stores/community.js'
import { getEvent } from './stores/event.js'
import { getLetter, getScheduledLetters, updateSentStatus } from './stores/letter.js'
import { getUserPersonalInformation, getUser } from './stores/user.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { send } from './utils/sendgrid.js'
import * as sgMail from './utils/sendgrid.js'
import { getCommunityUrl, getEventUrl } from './utils/urls.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('letter')

const LETTER_ID = 'd-e1ca1ca620374bfeaf0697495dbacb20'

interface UserEmailWithName {
  email: string
  name: string
}

/**
 * エラーの集計情報を作成
 */
function getErrorSummary(results: PromiseSettledResult<unknown>[]): Record<string, number> {
  const summary: Record<string, number> = {}
  results.forEach((result) => {
    if (result.status === 'rejected') {
      const errorMessage = result.reason?.message || String(result.reason)
      summary[errorMessage] = (summary[errorMessage] || 0) + 1
    }
  })
  return summary
}

/**
 * コミュニティメンバーのIDを取得
 */
async function getCommunityMemberIds(communityId: string): Promise<string[]> {
  try {
    const community = await getCommunity(communityId)
    if (!community) {
      logger.warn('Community not found', { communityId })
      return []
    }

    const members = await community.getMembers()
    return members.map((member) => member.id)
  } catch (error) {
    logger.error('Error fetching community members', { communityId, error })
    throw error
  }
}

/**
 * イベント参加者のユーザーIDを取得
 */
async function getParticipantIds(eventId: string): Promise<string[]> {
  try {
    if (!eventId) {
      logger.warn('No event_id provided', { eventId })
      return []
    }

    const event = await getEvent(eventId)
    if (!event) {
      logger.warn('Event not found', { eventId })
      return []
    }

    const orders = await event.getOrders('ordered')
    return orders.map((order) => order.user_id)
  } catch (error) {
    logger.error('Error fetching event participants', { eventId, error })
    throw error
  }
}

/**
 * ユーザーのメールアドレスと名前を取得
 */
async function getUserEmailWithName(userId: string): Promise<UserEmailWithName | null> {
  try {
    const [userPersonalInfo, user] = await Promise.all([getUserPersonalInformation(userId), getUser(userId, true)])

    if (!userPersonalInfo) {
      logger.warn('User personal information not found', { userId })
      return null
    }

    if (!user) {
      logger.warn('User not found', { userId })
      return null
    }

    if (!userPersonalInfo.user_email) {
      logger.warn('User email is missing', {
        userId,
        hasPersonalInfo: !!userPersonalInfo,
      })
      return null
    }

    if (!user.user_name) {
      logger.warn('User name is missing', {
        userId,
        email: userPersonalInfo.user_email,
      })
      return null
    }

    // メールアドレスのバリデーション強化
    const email = userPersonalInfo.user_email.trim()
    if (email === '') {
      logger.warn('User email is empty or whitespace only', { userId })
      return null
    }

    // 基本的なメールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      logger.warn('User email format is invalid', { userId, email })
      return null
    }

    return {
      email: email,
      name: user.user_name,
    }
  } catch (error) {
    logger.error('Error fetching user email and name', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}

/**
 * レタータイプに応じてユーザーIDを取得
 */
async function getUserIdsByLetterType(letterType: string, communityId: string, eventId?: string): Promise<string[]> {
  try {
    switch (letterType) {
      case 'community':
        return await getCommunityMemberIds(communityId)
      case 'event_participant':
        return eventId ? await getParticipantIds(eventId) : []
      case 'event_non_participant': {
        const [participantIds, communityMemberIds] = await Promise.all([
          eventId ? getParticipantIds(eventId) : Promise.resolve([]),
          getCommunityMemberIds(communityId),
        ])
        return communityMemberIds.filter((id) => !participantIds.includes(id))
      }
      default:
        logger.warn('Unknown letter type', { letterType })
        return []
    }
  } catch (error) {
    logger.error('Error fetching user IDs for letter type', { letterType, communityId, eventId, error })
    return []
  }
}

/**
 * 時間指定されたレターを送信する
 */
export async function sendLetter(_: number, end: number): Promise<void> {
  const sendLetterByTransaction = async (transaction: Transaction) => {
    const lettersWithRefs = await getScheduledLetters(end, transaction)
    const sendLetterPromises = lettersWithRefs.map(async ({ letter, ref }) => {
      const type = letter.letter_type
      const communityAccount = letter.community_account
      if (!communityAccount) {
        logger.warn('No community_account provided', { letterId: letter.id })
        return
      }

      const community = await getCommunityByAccount(communityAccount, transaction)

      if (!community) {
        logger.warn('Community not found for account', { communityAccount, letterId: letter.id })
        return
      }

      const communityId = community.id
      const communityEmail = community.community_email || DEFAULT_FROM
      const communityData = {
        community_name: community.community_name,
        community_url: getCommunityUrl(communityAccount),
      }

      // イベント情報の取得
      const eventData = {
        event_name: null as string | null,
        event_url: null as string | null,
        event_date: null as string | null,
      }
      if (letter.event_id) {
        const event = await getEvent(letter.event_id)
        if (event) {
          eventData.event_name = event.event_name
          eventData.event_url = getEventUrl(communityAccount, letter.event_id)
          eventData.event_date = convertToDateWeekdayShort(event.event_start_datetime)
        }
      }

      // レタータイプに応じてユーザーIDを取得
      const userIds = await getUserIdsByLetterType(type, communityId, letter.event_id)

      // ユーザー情報の取得
      const userInfos = await Promise.all(userIds.map(getUserEmailWithName))
      const validUserInfos = userInfos.filter((info): info is UserEmailWithName => info !== null)

      // サポートアカウントを追加
      validUserInfos.push({
        email: SUPPORT_MAIL,
        name: 'サポートアカウント',
      })

      // コミュニティメールのバリデーション
      if (!communityEmail || communityEmail.trim() === '') {
        logger.error('Invalid community email', {
          communityId,
          communityAccount,
          communityEmail,
        })
        return
      }

      try {
        // 送信直前に sent に更新（2重送信防止）
        await updateSentStatus(ref, transaction)

        // コミュニティメールのバリデーション
        if (!communityEmail || communityEmail.trim() === '') {
          logger.error('letter | Invalid community email', {
            communityId,
            communityAccount,
            communityEmail,
          })
          throw new Error('Community email is invalid')
        }

        // Promise.allSettled を使用して、一部失敗しても続行
        const results = await Promise.allSettled(
          validUserInfos.map(async (userInfo) => {
            const dynamicTemplateData = {
              ...communityData,
              ...eventData,
              letter_title: letter.letter_title,
              letter_content: letter.letter_content,
              letter_type: type,
              user_name: userInfo.name || 'ユーザー',
            }

            return send({
              to: userInfo.email,
              from: DEFAULT_FROM,
              replyTo: communityEmail.trim(),
              subject: letter.letter_title,
              templateId: LETTER_ID,
              dynamicTemplateData,
            })
          }),
        )

        // 成功・失敗の集計
        const successCount = results.filter((r) => r.status === 'fulfilled').length
        const failedCount = results.filter((r) => r.status === 'rejected').length

        // 失敗したメールのログ出力
        if (failedCount > 0) {
          // エラーの集計情報を取得（詳細は sendgrid.ts のログを参照）
          const errorSummary = getErrorSummary(results)

          logger.warn(`letter | Failed to send ${failedCount}/${validUserInfos.length} letters`, {
            letterId: letter.id,
            communityAccount,
            successCount,
            failedCount,
            errorSummary,
          })
        } else {
          logger.info(`letter | Successfully sent letter to ${successCount} recipients`, {
            letterId: letter.id,
            successCount,
          })
        }
      } catch (error) {
        // ステータス更新またはメール送信のエラー
        logger.error('letter | Failed to send letter after status update', {
          letterId: letter.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    })

    await Promise.all(sendLetterPromises)
  }

  const db = getFirestore()
  return db.runTransaction(sendLetterByTransaction)
}

const generateDynamicTemplateData = async (communityId: string, letterId: string) => {
  const [letter, community] = await Promise.all([getLetter(communityId, letterId), getCommunity(communityId)])
  if (community === undefined) {
    throw new HttpsError('not-found', 'the community is not found.')
  }
  if (letter === undefined) {
    throw new HttpsError('not-found', 'the letter is not found.')
  }
  if (letter.status !== 'draft') {
    throw new HttpsError('invalid-argument', 'The letter status must be in draft.')
  }
  let eventInfo = {}
  if (letter.event_id !== undefined) {
    const event = await getEvent(letter.event_id)
    if (event !== undefined) {
      eventInfo = {
        event_name: event.event_name,
        event_url: getEventUrl(event.community_account, event.id),
        event_date: convertToDate(event.event_start_datetime),
      }
    }
  }
  return {
    subject: letter.letter_title,
    community_name: community.community_name,
    community_url: getCommunityUrl(community.community_account),
    letter_title: letter.letter_title,
    letter_content: letter.letter_content,
    letter_type: letter.letter_type,
    user_name: 'ユーザー名',
    ...eventInfo,
  }
}

export const sendTestLetter = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid === undefined) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
    }
    const { communityId, letterId } = sendTestLetterRequestSchema.parse(request.data)
    const to = (await getUserPersonalInformation(uid))?.user_email
    if (to === undefined) {
      throw new HttpsError('not-found', 'The user is not valid.')
    }
    await sgMail.send({
      to,
      from: DEFAULT_FROM,
      templateId: LETTER_ID,
      dynamicTemplateData: await generateDynamicTemplateData(communityId, letterId),
    })
  },
)
