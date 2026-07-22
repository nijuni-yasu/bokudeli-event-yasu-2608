import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
}))

vi.mock('../stores/user.js', () => ({
  getUser: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: vi.fn(),
}))

import { getUser } from '../stores/user.js'
import { getEnterpriseMember } from '../stores/enterprise.js'
import { assertEnterpriseProfileAccess, isEnterpriseViewer } from './enterpriseProfileAccess.js'

const enterpriseAuth = {
  uid: 'viewer-1',
  token: { enterprise_id: 'ent-a', user_type: 'enterprise' },
}

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  user_id: 'target-1',
  is_deleted: false,
  enterprise_id: 'ent-a',
  ...overrides,
})

beforeEach(() => {
  vi.mocked(getUser).mockReset()
  vi.mocked(getEnterpriseMember).mockReset()
})

describe('isEnterpriseViewer', () => {
  it('enterprise_id claim ありで true', () => {
    expect(isEnterpriseViewer(enterpriseAuth)).toBe(true)
  })

  it('enterprise_id なしで false', () => {
    expect(isEnterpriseViewer({ uid: 'u1', token: {} })).toBe(false)
    expect(isEnterpriseViewer(null)).toBe(false)
  })
})

describe('assertEnterpriseProfileAccess', () => {
  it('同社 active メンバーは成功し department を返す', async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser() as never)
    vi.mocked(getEnterpriseMember).mockResolvedValue({
      is_active: true,
      department: '営業部',
    } as never)

    const ctx = await assertEnterpriseProfileAccess(enterpriseAuth, 'target-1')

    expect(ctx.viewerEnterpriseId).toBe('ent-a')
    expect(ctx.department).toBe('営業部')
  })

  it('未ログインは unauthenticated', async () => {
    await expect(assertEnterpriseProfileAccess(null, 'target-1')).rejects.toMatchObject({
      code: 'unauthenticated',
    })
  })

  it('viewer に enterprise_id なしは permission-denied', async () => {
    await expect(assertEnterpriseProfileAccess({ uid: 'u1', token: {} }, 'target-1')).rejects.toMatchObject({
      code: 'permission-denied',
    })
  })

  it('存在しない target は not-found', async () => {
    vi.mocked(getUser).mockResolvedValue(undefined)

    await expect(assertEnterpriseProfileAccess(enterpriseAuth, 'missing')).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('退会済み target は not-found', async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ is_deleted: true }) as never)

    await expect(assertEnterpriseProfileAccess(enterpriseAuth, 'target-1')).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('停止メンバーは not-found', async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser() as never)
    vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)

    await expect(assertEnterpriseProfileAccess(enterpriseAuth, 'target-1')).rejects.toMatchObject({
      code: 'not-found',
    })
  })

  it('他社 target は permission-denied', async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: 'ent-b' }) as never)

    await expect(assertEnterpriseProfileAccess(enterpriseAuth, 'target-1')).rejects.toMatchObject({
      code: 'permission-denied',
    })
    expect(getEnterpriseMember).not.toHaveBeenCalled()
  })

  it('enterprise_id なし target（ゲスト uid）は not-found', async () => {
    vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: undefined }) as never)

    await expect(assertEnterpriseProfileAccess(enterpriseAuth, 'guest-1')).rejects.toMatchObject({
      code: 'not-found',
    })
  })
})
