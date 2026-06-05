import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'
import { createModuleLogger } from './logger.js'
import { getSlackWebhookUrl } from '../stores/slackBot.js'

const logger = createModuleLogger('slackMessage')

export const sendSlackWebhookMessage = async (webhookUrl: string, text: string): Promise<void> => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    logger.error('Slack webhook request failed', { status: response.status, statusText: response.statusText })
    throw new Error(`Slack webhook request failed: ${response.status}`)
  }
}

export const sendCommunityBotMessage = async (bot: CommunityBot, text: string): Promise<void> => {
  if (bot.type !== 'slack') {
    return
  }
  const webhookUrl = await getSlackWebhookUrl(bot.reference)
  if (webhookUrl == null || webhookUrl === '') {
    logger.warn('Slack webhook url is missing', { botId: bot.id })
    return
  }
  await sendSlackWebhookMessage(webhookUrl, text)
}

export const sendCommunityBotsMessage = async (bots: CommunityBot[], text: string): Promise<void> => {
  if (bots.length === 0) {
    return
  }

  const results = await Promise.allSettled(bots.map((bot) => sendCommunityBotMessage(bot, text)))
  const failedCount = results.filter((r) => r.status === 'rejected').length
  if (failedCount > 0) {
    logger.warn('Failed to send Slack message to some bots', {
      failedCount,
      successCount: results.length - failedCount,
      totalBots: bots.length,
    })
  }
}

/** 1 件でも送信失敗したら throw する。1 回きりの Trigger（注文通知等）向け。 */
export const sendCommunityBotsMessageOrThrow = async (bots: CommunityBot[], text: string): Promise<void> => {
  if (bots.length === 0) {
    return
  }

  const results = await Promise.allSettled(bots.map((bot) => sendCommunityBotMessage(bot, text)))
  const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (rejected.length > 0) {
    logger.error('Failed to send Slack message to some bots', {
      failedCount: rejected.length,
      successCount: results.length - rejected.length,
      totalBots: bots.length,
    })
    throw rejected[0]!.reason
  }
}
