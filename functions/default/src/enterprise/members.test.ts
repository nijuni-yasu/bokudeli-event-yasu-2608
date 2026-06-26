import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserMock, saveUserMock, updateUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  saveUserMock: vi.fn(),
  updateUserMock: vi.fn(),
}))

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

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    updateUser: updateUserMock,
  }),
}))

vi.mock('../stores/enterprise.js', () => ({
  countActiveEnterpriseAdmins: vi.fn(),
  getEnterpriseById: vi.fn(),
  getEnterpriseMember: vi.fn(),
  listEnterpriseMembers: vi.fn(),
  saveEnterpriseMember: vi.fn(),
}))

vi.mock('../stores/user.js', () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
  getUserIdFromEmail: vi.fn(),
  getUserPersonalInformation: vi.fn(),
  saveUser: (...args: unknown[]) => saveUserMock(...args),
  ShokujiiUser: class ShokujiiUser {
    id: string
    user_name = ''
    user_email = ''
    constructor(id: string) {
      this.id = id
    }
  },
}))

vi.mock('../utils/auditLog.js', () => ({
  writeAuditLog: vi.fn(),
}))

vi.mock('../utils/enterpriseAuthHelpers.js', () => ({
  assertEnterpriseAdmin: vi.fn(),
  getClientIp: vi.fn(),
}))

vi.mock('../utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { getEnterpriseMember, saveEnterpriseMember } from '../stores/enterprise.js'
import { updateEnterpriseMember } from './members.js'

type UpdateEnterpriseMemberHandler = (req: {
  auth: { uid: string }
  data: {
    enterprise_id: string
    user_id: string
    display_name: string
    department?: string
  }
  rawRequest: unknown
}) => Promise<{ success: true }>

const callUpdateEnterpriseMember = (data: {
  enterprise_id: string
  user_id: string
  display_name: string
  department?: string
}) =>
  (updateEnterpriseMember as unknown as UpdateEnterpriseMemberHandler)({
    auth: { uid: 'admin-uid' },
    data,
    rawRequest: {},
  })

beforeEach(() => {
  getUserMock.mockReset()
  saveUserMock.mockReset()
  updateUserMock.mockReset()
  vi.mocked(getEnterpriseMember).mockReset()
  vi.mocked(saveEnterpriseMember).mockReset()

  vi.mocked(getEnterpriseMember).mockResolvedValue({
    id: 'member-uid',
    user_id: 'member-uid',
    display_name: '旧名前',
    role: 'member',
    is_active: true,
  } as never)
  saveUserMock.mockResolvedValue(undefined)
  updateUserMock.mockResolvedValue(undefined)
})

describe('updateEnterpriseMember', () => {
  it('表示名更新時に getUser(true) で user_email を保持して saveUser する', async () => {
    const user = {
      id: 'member-uid',
      user_name: '旧名前',
      user_email: 'member@company.com',
    }
    getUserMock.mockResolvedValue(user)

    await callUpdateEnterpriseMember({
      enterprise_id: 'ent-a',
      user_id: 'member-uid',
      display_name: '新名前',
    })

    expect(getUserMock).toHaveBeenCalledWith('member-uid', true)
    expect(saveUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_name: '新名前',
        user_email: 'member@company.com',
      }),
    )
  })
})
