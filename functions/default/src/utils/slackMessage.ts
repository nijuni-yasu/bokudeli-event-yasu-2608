import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'
import { createModuleLogger } from './logger.js'
import { getSlackWebhookUrl, removeCommunityBot } from '../stores/slackBot.js'

const logger = createModuleLogger('slackMessage')

/** Incoming Webhook 失敗時、communities/{id}/bots の紐付けを削除してよい Slack エラー */
const REMOVABLE_SLACK_WEBHOOK_ERRORS = [
  'no_service',
  'no_active_hooks',
  'invalid_token',
  'channel_is_archived',
  'channel_not_found',
] as const

type RemovableSlackWebhookError = (typeof REMOVABLE_SLACK_WEBHOOK_ERRORS)[number]

const matchRemovableSlackWebhookError = (body: string): RemovableSlackWebhookError | undefined => {
  const normalized = body.trim().toLowerCase()
  return REMOVABLE_SLACK_WEBHOOK_ERRORS.find((code) => normalized.includes(code))
}

export class SlackWebhookGoneError extends Error {
  readonly status: number
  readonly slackError: string | undefined

  constructor(status: number, slackError?: string) {
    const suffix = slackError != null && slackError !== '' ? ` (${slackError})` : ''
    super(`Slack webhook request failed: ${status}${suffix}`)
    this.name = 'SlackWebhookGoneError'
    this.status = status
    this.slackError = slackError
  }
}

const shouldRemoveSlackBotBinding = (status: number, body: string): { remove: boolean; slackError?: string } => {
  if (status === 410) {
    return { remove: true, slackError: matchRemovableSlackWebhookError(body) }
  }
  const matched = matchRemovableSlackWebhookError(body)
  if (matched != null) {
    return { remove: true, slackError: matched }
  }
  return { remove: false }
}

export const sendSlackWebhookMessage = async (webhookUrl: string, text: string): Promise<void> => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const body = await response.text()
    const { remove, slackError } = shouldRemoveSlackBotBinding(response.status, body)
    if (remove) {
      throw new SlackWebhookGoneError(response.status, slackError)
    }
    if (response.status === 404 || response.status === 410) {
      logger.warn('Slack webhook request failed with non-removable client error', {
        status: response.status,
        slackError: body.trim() !== '' ? body.trim() : undefined,
      })
      return
    }
    logger.error('Slack webhook request failed', { status: response.status, statusText: response.statusText })
    throw new Error(`Slack webhook request failed: ${response.status}`)
  }
}

const handleInvalidSlackBot = async (
  communityId: string,
  bot: CommunityBot,
  status: number,
  slackError?: string,
): Promise<void> => {
  logger.warn('Slack webhook is gone; removing community bot binding', {
    communityId,
    botId: bot.id,
    status,
    slackError,
  })
  try {
    await removeCommunityBot(communityId, bot.id)
  } catch (error) {
    logger.warn('Failed to remove community bot after gone webhook', {
      communityId,
      botId: bot.id,
      status,
      slackError,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const sendCommunityBotMessage = async (communityId: string, bot: CommunityBot, text: string): Promise<void> => {
  if (bot.type !== 'slack') {
    return
  }
  const webhookUrl = await getSlackWebhookUrl(bot.reference)
  if (webhookUrl == null || webhookUrl === '') {
    logger.warn('Slack webhook url is missing', { communityId, botId: bot.id })
    return
  }
  try {
    await sendSlackWebhookMessage(webhookUrl, text)
  } catch (error) {
    if (error instanceof SlackWebhookGoneError) {
      await handleInvalidSlackBot(communityId, bot, error.status, error.slackError)
      return
    }
    throw error
  }
}

export const sendCommunityBotsMessage = async (
  communityId: string,
  bots: CommunityBot[],
  text: string,
): Promise<void> => {
  if (bots.length === 0) {
    return
  }

  const results = await Promise.allSettled(bots.map((bot) => sendCommunityBotMessage(communityId, bot, text)))
  const failedCount = results.filter((r) => r.status === 'rejected').length
  if (failedCount > 0) {
    logger.warn('Failed to send Slack message to some bots', {
      communityId,
      failedCount,
      successCount: results.length - failedCount,
      totalBots: bots.length,
    })
  }
}

/** transient 失敗時のみ throw する。webhook 失効・チャンネル不可の判定時は自動 remove して部分成功を許容。 */
export const sendCommunityBotsMessageOrThrow = async (
  communityId: string,
  bots: CommunityBot[],
  text: string,
): Promise<void> => {
  if (bots.length === 0) {
    return
  }

  const results = await Promise.allSettled(bots.map((bot) => sendCommunityBotMessage(communityId, bot, text)))
  const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (rejected.length > 0) {
    logger.error('Failed to send Slack message to some bots', {
      communityId,
      failedCount: rejected.length,
      successCount: results.length - rejected.length,
      totalBots: bots.length,
    })
    throw rejected[0]!.reason
  }
}
