import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

import { sendCommunityBotsMessage, sendCommunityBotsMessageOrThrow, sendSlackWebhookMessage } from './slackMessage.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

const communityId = 'comm-1'
const reference = { path: 'slackbots/T1/channels/C1' } as CommunityBot['reference']

const createSlackBot = (id: string): CommunityBot =>
  new CommunityBot(id, {
    type: 'slack',
    reference,
  })

const mockFetchResponse = (params: { ok: boolean; status: number; statusText: string; body?: string }) => ({
  ok: params.ok,
  status: params.status,
  statusText: params.statusText,
  text: async () => params.body ?? '',
})

describe('sendSlackWebhookMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    loggerErrorMock.mockReset()
    loggerWarnMock.mockReset()
  })

  it('404 + no_service は SlackWebhookGoneError を throw する', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'no_service' })),
    )

    await expect(sendSlackWebhookMessage('https://hooks.slack.com/test', 'hello')).rejects.toMatchObject({
      name: 'SlackWebhookGoneError',
      status: 404,
      slackError: 'no_service',
    })
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it('404 + 未知の本文は remove 対象外として WARN のみ', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'unknown_error' }),
        ),
    )

    await expect(sendSlackWebhookMessage('https://hooks.slack.com/test', 'hello')).resolves.toBeUndefined()
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Slack webhook request failed with non-removable client error',
      expect.objectContaining({ status: 404, slackError: 'unknown_error' }),
    )
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it('500 は ERROR ログのうえ throw する', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse({ ok: false, status: 500, statusText: 'Internal Server Error' })),
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
          return mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'no_service' })
        }
        return mockFetchResponse({ ok: true, status: 200, statusText: 'OK' })
      }),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [goneBot, okBot], 'hello')).resolves.toBeUndefined()

    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-gone')
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Slack webhook is gone; removing community bot binding',
      expect.objectContaining({ communityId, botId: 'slack-gone', status: 404, slackError: 'no_service' }),
    )
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it('404 + channel_is_archived でも bot を remove する', async () => {
    const bot = createSlackBot('slack-archived')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          body: 'channel_is_archived',
        }),
      ),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-archived')
  })

  it('404 + channel_not_found でも bot を remove する', async () => {
    const bot = createSlackBot('slack-not-found')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          body: 'channel_not_found',
        }),
      ),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-not-found')
  })

  it('404 + 未知の本文では remove せず成功扱いにする', async () => {
    const bot = createSlackBot('slack-unknown')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'temporary_failure' }),
        ),
    )

    await expect(sendCommunityBotsMessageOrThrow(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).not.toHaveBeenCalled()
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Slack webhook request failed with non-removable client error',
      expect.objectContaining({ status: 404, slackError: 'temporary_failure' }),
    )
  })

  it('500 応答時は throw する', async () => {
    const bot = createSlackBot('slack-fail')
    getSlackWebhookUrlMock.mockResolvedValue('https://hooks.slack.com/test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse({ ok: false, status: 500, statusText: 'Internal Server Error' })),
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
      vi
        .fn()
        .mockResolvedValue(
          mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'no_active_hooks' }),
        ),
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
          return mockFetchResponse({ ok: false, status: 404, statusText: 'Not Found', body: 'no_service' })
        }
        return mockFetchResponse({ ok: true, status: 200, statusText: 'OK' })
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
      vi.fn().mockResolvedValue(mockFetchResponse({ ok: false, status: 410, statusText: 'Gone', body: 'no_service' })),
    )

    await expect(sendCommunityBotsMessage(communityId, [bot], 'hello')).resolves.toBeUndefined()
    expect(removeCommunityBotMock).toHaveBeenCalledWith(communityId, 'slack-gone-410')
  })
})
