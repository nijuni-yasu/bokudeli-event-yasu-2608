import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'
import { createModuleLogger } from './logger.js'
import { getSlackWebhookUrl, removeCommunityBot } from '../stores/slackBot.js'

const logger = createModuleLogger('slackMessage')

export class SlackWebhookGoneError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Slack webhook request failed: ${status}`)
    this.name = 'SlackWebhookGoneError'
    this.status = status
  }
}

const isSlackWebhookGoneStatus = (status: number): boolean => status === 404 || status === 410

export const sendSlackWebhookMessage = async (webhookUrl: string, text: string): Promise<void> => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    if (isSlackWebhookGoneStatus(response.status)) {
      throw new SlackWebhookGoneError(response.status)
    }
    logger.error('Slack webhook request failed', { status: response.status, statusText: response.statusText })
    throw new Error(`Slack webhook request failed: ${response.status}`)
  }
}

const handleInvalidSlackBot = async (communityId: string, bot: CommunityBot, status: number): Promise<void> => {
  logger.warn('Slack webhook is gone; removing community bot binding', {
    communityId,
    botId: bot.id,
    status,
  })
  try {
    await removeCommunityBot(communityId, bot.id)
  } catch (error) {
    logger.warn('Failed to remove community bot after gone webhook', {
      communityId,
      botId: bot.id,
      status,
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
      await handleInvalidSlackBot(communityId, bot, error.status)
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

/** transient 失敗時のみ throw する。404/410 は自動 remove して部分成功を許容。 */
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
