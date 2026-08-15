import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'

const { getSlackWebhookUrlMock, removeCommunityBotMock, loggerErrorMock, loggerWarnMock } = vi.hoisted(() => ({
  getSlackWebhookUrlMock: vi.fn(),
  removeCommunityBotMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}))

vi.mock('../stores/slackBot.js', () => ({
  getSlackWebhookUrl: (...args: unknown[]) => getSlackWebhookUrlMock(...args),
  removeCommunityBot: (...args: unknown[]) => removeCommunityBotMock(...args),
}))

vi.mock('./logger.js', () => ({
  createModuleLogger: () => ({
    error: loggerErrorMock,
    info: vi.fn(),
    warn: loggerWarnMock,
  }),
}))

import {
  sendCommunityBotsMessage,
  sendCommunityBotsMessageOrThrow,
  sendSlackWebhookMessage,
  SlackWebhookGoneError,
} from './slackMessage.js'

const communityId = 'comm-1'
const reference = { path: 'slackbots/T1/channels/C1' } as CommunityBot['reference']

const createSlackBot = (id: string): CommunityBot =>
  new CommunityBot(id, {
    type: 'slack',
    reference,
  })

describe('sendSlackWebhookMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    loggerErrorMock.mockReset()
    loggerWarnMock.mockReset()
  })

  it('404 は SlackWebhookGoneError を throw する', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    )

    await expect(sendSlackWebhookMessage('https://hooks.slack.com/test', 'hello')).rejects.toBeInstanceOf(
      SlackWebhookGoneError,
    )
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it('500 は ERROR ログのうえ throw する', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    await expect(sendSlackWebhookMessage('https://hooks.slack.com/test', 'hello')).rejects.toThrow(
      'Slack webhook request failed: 500',
    )
    expect(loggerErrorMock).toHaveBeenCalled()
  })
})

describe('sendCommunityBotsMessageOrThrow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    getSlackWebhookUrlMock.mockReset()
    removeCommunityBotMock.mockReset()
    loggerErrorMock.mockReset()
    loggerWarnMock.mockReset()
    removeCommunityBotMock.mockResolvedValue(undefined)
  })

  it('404 bot と 200 bot が混在しても成功し、404 bot を remove する', async () => {
    const goneBot = createSlackBot('slack-gone')
    const okBot = createSlackBot('slack-ok')

    getSlackWebhookUrlMock
      .mockResolvedValueOnce('https://hooks.slack.com/gone')
      .mockResolvedValueOnce('https://hooks.slack.com/ok')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('gone')) {
          return { ok: false, status: 404, statusText: 'Not Found' }
        }
        return { ok: true, status: 200, statusText: 'OK' }
      }),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [goneBot, okBot], 'hello')).resolves.toBeUndefined()

    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-gone')
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Slack webhook is gone; removing community bot binding',
      expect.objectContaining({ communityId, botId: 'slack-gone', status: 404 }),
    )
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it('500 応答時は throw する', async () => {
    const bot = createSlackBot('slack-fail')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [bot], 'hello')).rejects.toThrow(
      'Slack webhook request failed: 500',
    )
    expect(removeCommunityBotMock).not.toHaveBeenCalled()
    expect(loggerErrorMock).toHaveBeenCalled()
  })

  it('404 のみの場合は remove して成功する', async () => {
    const bot = createSlackBot('slack-gone-only')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-gone-only')
  })

  it('removeCommunityBot 失敗時も他 bot 送信は継続する', async () => {
    const goneBot = createSlackBot('slack-gone')
    const okBot = createSlackBot('slack-ok')

    getSlackWebhookUrlMock
      .mockResolvedValueOnce('https://hooks.slack.com/gone')
      .mockResolvedValueOnce('https://hooks.slack.com/ok')
    removeCommunityBotMock.mockRejectedValueOnce(new Error('firestore unavailable'))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('gone')) {
          return { ok: false, status: 404, statusText: 'Not Found' }
        }
        return { ok: true, status: 200, statusText: 'OK' }
      }),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [goneBot, okBot], 'hello')).resolves.toBeUndefined()

    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Failed to remove community bot after gone webhook',
      expect.objectContaining({ communityId, botId: 'slack-gone' }),
    )
  })
})

describe('sendCommunityBotsMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    getSlackWebhookUrlMock.mockReset()
    removeCommunityBotMock.mockReset()
    loggerWarnMock.mockReset()
    removeCommunityBotMock.mockResolvedValue(undefined)
  })

  it('410 でも bot を remove して warn のみ', async () => {
    const bot = createSlackBot('slack-gone-410')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
        statusText: 'Gone',
      }),
    )

    await expect(sendCommunityBotsMessage(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-gone-410')
  })
})
