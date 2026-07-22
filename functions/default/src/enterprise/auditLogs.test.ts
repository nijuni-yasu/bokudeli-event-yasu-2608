import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: <T>(handler: T) => handler,
}))

vi.mock('../stores/auditLog.js', () => ({
  listAuditLogs: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: vi.fn(),
  listEnterpriseMembers: vi.fn(),
}))

vi.mock('../stores/community.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../stores/community.js')>()
  return {
    ...actual,
    getCommunitiesByIds: vi.fn(),
  }
})

vi.mock('../stores/event.js', () => ({
  getEventsInCommunities: vi.fn(),
  getCommunityEventKey: (communityId: string, eventId: string) => `${communityId}\t${eventId}`,
}))

vi.mock('../utils/enterpriseAuthHelpers.js', () => ({
  assertEnterpriseAdmin: vi.fn(),
}))

import { AuditLog } from '@shokujii/common/schemas/AuditLog.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { AuditLogQueryError } from '@shokujii/common/utils/auditLogCursor.js'
import { assertEnterpriseAdmin } from '../utils/enterpriseAuthHelpers.js'
import { getEnterpriseById, listEnterpriseMembers } from '../stores/enterprise.js'
import { getCommunitiesByIds, ShokujiiCommunity } from '../stores/community.js'
import { listAuditLogs } from '../stores/auditLog.js'
import { enrichAuditLogItems, getEnterpriseAuditLogs } from './auditLogs.js'

describe('enrichAuditLogItems', () => {
  beforeEach(() => {
    vi.mocked(getCommunitiesByIds).mockResolvedValue(new Map())
    vi.mocked(getEnterpriseById).mockResolvedValue(
      new Enterprise('ent1', { company_name: '株式会社テスト', subdomain: 'test' }),
    )
    vi.mocked(listEnterpriseMembers).mockResolvedValue([
      new EnterpriseMember('u1', {
        user_id: 'u1',
        user_email: 'a@example.com',
        display_name: '田中太郎',
        role: 'admin',
        is_active: true,
      }),
    ])
  })

  it('操作者と order_session 対象を enrich する', async () => {
    const items = await enrichAuditLogItems('ent1', [
      new AuditLog('log1', {
        enterprise_id: 'ent1',
        user_id: 'u1',
        action: 'order_create',
        target_type: 'order_session',
        timestamp: 1_700_000_000_000,
        details: { order_ids: ['o1', 'o2'] },
      }),
    ])

    expect(items[0]?.operator_label).toBe('田中太郎')
    expect(items[0]?.target_label).toBe('注文セッション（2件）')
  })

  it('community 対象の表示名を enrich する', async () => {
    vi.mocked(getCommunitiesByIds).mockResolvedValue(
      new Map([
        [
          'c1',
          new ShokujiiCommunity('c1', {
            community_name: 'ランチ会',
            enterprise_id: 'ent1',
            community_account: 'lunch',
          }),
        ],
      ]),
    )

    const items = await enrichAuditLogItems('ent1', [
      new AuditLog('log2', {
        enterprise_id: 'ent1',
        user_id: 'u1',
        action: 'community_create',
        target_type: 'community',
        target_id: 'c1',
        timestamp: 1_700_000_000_000,
      }),
    ])

    expect(getCommunitiesByIds).toHaveBeenCalledWith(['c1'])
    expect(items[0]?.target_label).toBe('ランチ会')
  })

  it('他 enterprise の community 名は enrich しない', async () => {
    vi.mocked(getCommunitiesByIds).mockResolvedValue(
      new Map([
        [
          'c1',
          new ShokujiiCommunity('c1', {
            community_name: 'ランチ会',
            enterprise_id: 'ent2',
            community_account: 'lunch',
          }),
        ],
      ]),
    )

    const items = await enrichAuditLogItems('ent1', [
      new AuditLog('log3', {
        enterprise_id: 'ent1',
        user_id: 'u1',
        action: 'community_create',
        target_type: 'community',
        target_id: 'c1',
        timestamp: 1_700_000_000_000,
      }),
    ])

    expect(items[0]?.target_label).not.toBe('ランチ会')
    expect(items[0]?.target_label).toBe('c1')
  })
})

describe('getEnterpriseAuditLogs', () => {
  const handler = getEnterpriseAuditLogs as unknown as (request: {
    auth: { uid: string; token: { enterprise_id: string } }
    data: {
      enterprise_id: string
      page_size?: number
    }
  }) => Promise<{ items: unknown[]; has_next: boolean; next_cursor?: string }>

  beforeEach(() => {
    vi.mocked(assertEnterpriseAdmin).mockReset()
    vi.mocked(listAuditLogs).mockReset()
    vi.mocked(getCommunitiesByIds).mockResolvedValue(new Map())
    vi.mocked(getEnterpriseById).mockResolvedValue(
      new Enterprise('ent1', { company_name: '株式会社テスト', subdomain: 'test' }),
    )
    vi.mocked(listEnterpriseMembers).mockResolvedValue([])
  })

  it('admin チェック後に一覧を返す', async () => {
    vi.mocked(listAuditLogs).mockResolvedValue({
      logs: [
        new AuditLog('log1', {
          enterprise_id: 'ent1',
          user_id: 'system',
          action: 'event_auto_cancel',
          timestamp: 1_700_000_000_000,
        }),
      ],
      hasNext: false,
      nextCursor: null,
    })

    const result = await handler({
      auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
      data: { enterprise_id: 'ent1' },
    })

    expect(assertEnterpriseAdmin).toHaveBeenCalled()
    expect(result.items).toHaveLength(1)
    expect(result.has_next).toBe(false)
  })

  it('不正な cursor は invalid-argument', async () => {
    await expect(
      handler({
        auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', cursor: 'bad-cursor' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('日付範囲エラーは invalid-argument', async () => {
    vi.mocked(listAuditLogs).mockRejectedValue(new AuditLogQueryError('start_date format is invalid'))

    await expect(
      handler({
        auth: { uid: 'admin1', token: { enterprise_id: 'ent1' } },
        data: { enterprise_id: 'ent1', start_date: 'invalid' },
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})
