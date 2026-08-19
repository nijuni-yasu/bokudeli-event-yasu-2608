import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { HttpResponse } from './utils/httpResponse.js'
import type { ShokujiiEvent } from './stores/event.js'

vi.mock('firebase-functions/v2', () => ({
  https: {
    onRequest: (_opts: unknown, handler: unknown) => handler,
  },
}))

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => ({
        getMetadata: vi.fn().mockResolvedValue([{ contentType: 'image/png' }]),
      })),
    })),
  })),
}))

vi.mock('./stores/event.js', () => ({
  getEvent: vi.fn(),
}))

vi.mock('./stores/community.js', () => ({
  getCommunityByAccount: vi.fn(),
}))

vi.mock('./utils/urls.js', () => ({
  convertStoragePathToURL: (path: string) => `https://storage.example.com/${path}`,
  getEventSiteOrigin: () => 'https://shokujii.jp',
}))

vi.mock('./utils/resolveRequestSite.js', () => ({
  resolveRequestSite: vi.fn(() => 'https://shokujii.jp'),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { getEvent } from './stores/event.js'
import { getCommunityByAccount } from './stores/community.js'
import { handleCommunityOgpRequest, handleEventOgpRequest } from './ogpRequest.js'

const INDEX_HTML =
  '<!doctype html><html><head><title>shokujii</title><!-- OGP_BEGIN_TAG --><!-- OGP_END_TAG -->' +
  '<!-- SEO_HEAD_BEGIN --><!-- SEO_HEAD_END --></head><body><!-- SEO_BODY_BEGIN --><!-- SEO_BODY_END --></body></html>'

type OgpHandler = (req: { path: string }, res: HttpResponse) => Promise<void>

const eventHandler = handleEventOgpRequest as unknown as OgpHandler
const communityHandler = handleCommunityOgpRequest as unknown as OgpHandler

type Recorded = {
  status: number | undefined
  headers: Record<string, string>
  body: unknown
}

const createRes = (): { res: HttpResponse; recorded: Recorded } => {
  const recorded: Recorded = { status: undefined, headers: {}, body: undefined }
  const res: HttpResponse = {
    status(code) {
      recorded.status = code
      return res
    },
    set(field, value) {
      recorded.headers[field.toLowerCase()] = String(value)
      return res
    },
    setHeader(name, value) {
      recorded.headers[name.toLowerCase()] = String(value)
      return res
    },
    send(body) {
      recorded.body = body
      return res
    },
    json(body) {
      recorded.body = body
      return res
    },
    headersSent: false,
  }
  return { res, recorded }
}

const buildEvent = (overrides: Partial<ShokujiiEvent>): ShokujiiEvent =>
  ({
    id: 'evt1',
    community_id: 'com1',
    community_account: 'acct',
    community_name: 'コミュニティ',
    event_name: 'イベント',
    event_desc: '説明',
    event_start_datetime: 1700000000000,
    event_end_datetime: 1700003600000,
    event_status: { value: 'accepting_order' },
    shop_name: '店舗',
    event_address: '住所',
    event_address_base: '住所',
    event_address_detail: '詳細',
    is_public: true,
    is_deleted: false,
    enterprise_id: null,
    ...overrides,
  }) as unknown as ShokujiiEvent

const buildCommunity = (overrides: Record<string, unknown>) =>
  ({
    community_id: 'com1',
    community_account: 'acct',
    community_name: 'コミュニティ',
    community_desc: '説明',
    community_address_base: '住所',
    community_address_detail: '詳細',
    is_public: true,
    is_approved: true,
    enterprise_id: null,
    ...overrides,
  }) as unknown as Awaited<ReturnType<typeof getCommunityByAccount>>

beforeEach(() => {
  vi.mocked(getEvent).mockReset()
  vi.mocked(getCommunityByAccount).mockReset()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(INDEX_HTML, { status: 200 })),
  )
})

describe('handleEventOgpRequest', () => {
  it('限定公開イベントは 404 ではなく noindex 付きの素の SPA を返す', async () => {
    vi.mocked(getEvent).mockResolvedValue(buildEvent({ is_public: false }))
    const { res, recorded } = createRes()

    await eventHandler({ path: '/c/acct/e/evt1' }, res)

    expect(recorded.status).toBe(200)
    expect(recorded.headers['x-robots-tag']).toBe('noindex, nofollow')
    expect(recorded.headers['cache-control']).toBe('private, no-store')
    expect(recorded.body).toBe(INDEX_HTML)
  })

  it('公開イベントは SEO メタを注入して 200 を返す', async () => {
    vi.mocked(getEvent).mockResolvedValue(buildEvent({}))
    const { res, recorded } = createRes()

    await eventHandler({ path: '/c/acct/e/evt1' }, res)

    expect(recorded.status).toBe(200)
    expect(recorded.headers['x-robots-tag']).toBeUndefined()
    expect(recorded.body).toContain('<title>イベント | shokujii</title>')
  })

  it('削除済み・エンプラ配下・不在は 404 を返す', async () => {
    const cases: Partial<ShokujiiEvent>[] = [{ is_deleted: true }, { enterprise_id: 'ent1' }]
    for (const overrides of cases) {
      vi.mocked(getEvent).mockResolvedValue(buildEvent(overrides))
      const { res, recorded } = createRes()
      await eventHandler({ path: '/c/acct/e/evt1' }, res)
      expect(recorded.status).toBe(404)
    }

    vi.mocked(getEvent).mockResolvedValue(undefined)
    const { res, recorded } = createRes()
    await eventHandler({ path: '/c/acct/e/evt1' }, res)
    expect(recorded.status).toBe(404)
  })

  it('イベント ID の後ろに余分なセグメントがある URL は 404 を返す', async () => {
    const { res, recorded } = createRes()

    await eventHandler({ path: '/c/acct/e/evt1/foo' }, res)

    expect(recorded.status).toBe(404)
    expect(getEvent).not.toHaveBeenCalled()
  })

  it('パスのコミュニティアカウントがイベントと一致しない場合は 404 を返す', async () => {
    vi.mocked(getEvent).mockResolvedValue(buildEvent({ is_public: false }))
    const { res, recorded } = createRes()

    await eventHandler({ path: '/c/other/e/evt1' }, res)

    expect(recorded.status).toBe(404)
  })
})

describe('handleCommunityOgpRequest', () => {
  it('非公開コミュニティは noindex 付きの素の SPA を返す', async () => {
    vi.mocked(getCommunityByAccount).mockResolvedValue(buildCommunity({ is_public: false }))
    const { res, recorded } = createRes()

    await communityHandler({ path: '/c/acct' }, res)

    expect(recorded.status).toBe(200)
    expect(recorded.headers['x-robots-tag']).toBe('noindex, nofollow')
    expect(recorded.body).toBe(INDEX_HTML)
  })

  it('未承認コミュニティは noindex 付きの素の SPA を返す', async () => {
    vi.mocked(getCommunityByAccount).mockResolvedValue(buildCommunity({ is_approved: false }))
    const { res, recorded } = createRes()

    await communityHandler({ path: '/c/acct' }, res)

    expect(recorded.status).toBe(200)
    expect(recorded.headers['x-robots-tag']).toBe('noindex, nofollow')
  })

  it('エンプラ配下・不在は 404 を返す', async () => {
    vi.mocked(getCommunityByAccount).mockResolvedValue(buildCommunity({ enterprise_id: 'ent1' }))
    const enterpriseRes = createRes()
    await communityHandler({ path: '/c/acct' }, enterpriseRes.res)
    expect(enterpriseRes.recorded.status).toBe(404)

    vi.mocked(getCommunityByAccount).mockResolvedValue(undefined)
    const missingRes = createRes()
    await communityHandler({ path: '/c/acct' }, missingRes.res)
    expect(missingRes.recorded.status).toBe(404)
  })
})
