import { onCall, HttpsError } from 'firebase-functions/https'
import { sendIndividualLetterRequestSchema, sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'
import { convertToDateWeekdayShort, convertToDate } from '@shokujii/common/utils/datetime.js'
import { getCommunity } from './stores/community.js'
import { getEventInCommunity } from './stores/event.js'
import { getMemberIds } from './stores/memberOrder.js'
import { getLetter, getLetterRef, getScheduledLetters, updateLetterStatusWithCheck } from './stores/letter.js'
import { getUserPersonalInformation, getUser } from './stores/user.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { send } from './utils/sendgrid.js'
import * as sgMail from './utils/sendgrid.js'
import { sendDynamicTemplateWithPersonalizations } from './utils/sendgridBulk.js'
import { getCommunityUrl, getEventUrl } from './utils/urls.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('letter')

const LETTER_ID = 'd-e1ca1ca620374bfeaf0697495dbacb20'

interface UserEmailWithName {
  email: string
  name: string
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
 * イベント参加者のユーザーIDを取得（ordered のみ）
 */
async function getParticipantIds(communityId: string, eventId: string): Promise<string[]> {
  try {
    if (eventId === '') {
      logger.warn('No event_id provided', { communityId, eventId })
      return []
    }

    const event = await getEventInCommunity(communityId, eventId)
    if (event == null) {
      logger.warn('Event not found', { communityId, eventId })
      return []
    }

    const orders = await event.getOrders('ordered')
    return orders.map((order) => order.user_id)
  } catch (error) {
    logger.error('Error fetching event participants', { communityId, eventId, error })
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
        return eventId ? await getParticipantIds(communityId, eventId) : []
      case 'event_non_participant': {
        const [participantIds, communityMemberIds] = await Promise.all([
          eventId ? getParticipantIds(communityId, eventId) : Promise.resolve([]),
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
  // 送信対象レターを取得
  const lettersWithRefs = await getScheduledLetters(end)

  // 各レターを並列処理
  const sendLetterPromises = lettersWithRefs.map(async ({ letter, ref }) => {
    try {
      const type = letter.letter_type
      const communityAccount = letter.community_account
      if (!communityAccount) {
        logger.warn('No community_account provided', { letterId: letter.id })
        return
      }

      // レターは communities/{communityId}/letters 配下。account だけでは enterprise / PF を区別できないため ID で取得
      const communityId = ref.parent.parent?.id
      if (communityId == null || communityId === '') {
        logger.warn('Invalid letter document path', { letterId: letter.id })
        return
      }

      const community = await getCommunity(communityId)

      if (!community) {
        logger.warn('Community not found for letter', { communityId, communityAccount, letterId: letter.id })
        return
      }

      if (community.community_account !== communityAccount) {
        logger.warn('Community account mismatch on letter', {
          communityId,
          communityAccount,
          expected: community.community_account,
          letterId: letter.id,
        })
        return
      }
      const communityEmail =
        community.community_email != null && community.community_email !== '' ? community.community_email : DEFAULT_FROM
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
        const event = await getEventInCommunity(communityId, letter.event_id)
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
      if (communityEmail == null || communityEmail === '' || communityEmail.trim() === '') {
        logger.error('Invalid community email', {
          communityId,
          communityAccount,
          communityEmail,
        })
        return
      }

      // 送信済みステータスに更新（二重送信防止）
      try {
        await updateLetterStatusWithCheck(ref, 'timed', 'sent')
      } catch (error) {
        logger.error('Failed to update letter status', {
          letterId: letter.id,
          error: error instanceof Error ? error.message : String(error),
        })
        return // ステータス更新失敗の場合は送信しない
      }

      const recipients = validUserInfos.map((userInfo) => ({
        to: userInfo.email,
        dynamicTemplateData: {
          ...communityData,
          ...eventData,
          letter_title: letter.letter_title,
          letter_content: letter.letter_content,
          letter_type: type,
          user_name: userInfo.name || 'ユーザー',
        },
      }))

      const bulkResult = await sendDynamicTemplateWithPersonalizations(
        {
          from: DEFAULT_FROM,
          replyTo: communityEmail.trim(),
          subject: letter.letter_title,
          templateId: LETTER_ID,
        },
        recipients,
        { feature: 'letter', letterId: letter.id, communityId },
      )

      const totalRecipientsAccepted = bulkResult.totalRecipientsAccepted
      const batchesFailed = bulkResult.batchesFailed

      if (bulkResult.errors.length > 0) {
        const errorSummary = bulkResult.errors.reduce<Record<string, number>>((acc, e) => {
          const key = e.reason
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {})

        logger.warn('Letter bulk send had batch failures', {
          letterId: letter.id,
          communityAccount,
          totalRecipientsAccepted,
          batchesAttempted: bulkResult.batchesAttempted,
          batchesSucceeded: bulkResult.batchesSucceeded,
          batchesFailed,
          recipientTargetCount: validUserInfos.length,
          errorSummary,
          errors: bulkResult.errors,
        })
      } else {
        logger.info(`Successfully sent letter to ${totalRecipientsAccepted} users`, {
          letterId: letter.id,
          totalRecipientsAccepted,
        })
      }
    } catch (error) {
      // 予期しないエラー
      logger.error('Failed to process letter', {
        letterId: letter.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  })

  await Promise.all(sendLetterPromises)
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
    const event = await getEventInCommunity(communityId, letter.event_id)
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

export const sendIndividualLetter = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid === undefined) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
    }

    const { communityId, letterId } = sendIndividualLetterRequestSchema.parse(request.data)

    const letter = await getLetter(communityId, letterId)
    if (!letter) {
      throw new HttpsError('not-found', 'Letter not found.')
    }
    if (letter.letter_type !== 'individual') {
      throw new HttpsError('invalid-argument', 'Letter must be of type individual.')
    }
    if (letter.status !== 'draft') {
      throw new HttpsError('failed-precondition', 'Letter must be in draft status to send.')
    }
    if (letter.user_id == null || letter.user_id === '') {
      throw new HttpsError('invalid-argument', 'User is required.')
    }

    const community = await getCommunity(communityId)
    if (!community) {
      throw new HttpsError('not-found', 'Community not found.')
    }

    const isManager = await community.hasRole(uid, 'manager')
    if (!isManager) {
      throw new HttpsError('permission-denied', 'Only community managers can send direct emails.')
    }

    if (community.community_email == null || community.community_email === '') {
      throw new HttpsError('failed-precondition', 'Community email is not set.')
    }
    const communityEmail = community.community_email

    const eventData: {
      event_name: string | null
      event_url: string | null
      event_date: string | null
    } = {
      event_name: null,
      event_url: null,
      event_date: null,
    }

    // 受信者がコミュニティ／イベントの対象であることを検証
    if (letter.event_id != null && letter.event_id !== '') {
      const event = await getEventInCommunity(communityId, letter.event_id)
      if (event == null) {
        throw new HttpsError('not-found', 'Event not found.')
      }
      const eventMemberIds = await getMemberIds(communityId, letter.event_id)
      if (!eventMemberIds.includes(letter.user_id)) {
        throw new HttpsError('failed-precondition', 'Recipient is not a member of the event.')
      }
      eventData.event_name = event.event_name
      eventData.event_url = getEventUrl(community.community_account, letter.event_id)
      eventData.event_date = convertToDateWeekdayShort(event.event_start_datetime)
    } else {
      const memberIds = await getCommunityMemberIds(communityId)
      if (!memberIds.includes(letter.user_id)) {
        throw new HttpsError('failed-precondition', 'Recipient is not a member of the community.')
      }
    }

    const targetUser = await getUser(letter.user_id, true)
    if (!targetUser?.user_email) {
      throw new HttpsError('not-found', 'User email not found.')
    }
    const targetUserName = targetUser.user_name ?? 'ユーザー'

    const dynamicTemplateData = {
      community_name: community.community_name,
      community_url: getCommunityUrl(community.community_account),
      ...eventData,
      letter_title: letter.letter_title,
      letter_content: letter.letter_content,
      letter_type: 'individual',
      user_name: targetUserName,
    }

    const letterRef = getLetterRef(communityId, letterId)
    await updateLetterStatusWithCheck(letterRef, 'draft', 'sent')

    await send({
      to: targetUser.user_email,
      from: DEFAULT_FROM,
      replyTo: communityEmail,
      subject: letter.letter_title,
      templateId: LETTER_ID,
      dynamicTemplateData,
    })

    logger.info('Individual letter sent and saved', {
      communityId,
      letterId,
      userId: letter.user_id,
    })
  },
)
