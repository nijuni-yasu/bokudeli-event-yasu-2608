import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getUserMock,
  saveUserMock,
  updateUserMock,
  deleteUserMock,
  createUserMock,
  setCustomUserClaimsMock,
  deleteEnterpriseMemberMock,
  deleteUserDocumentsMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  saveUserMock: vi.fn(),
  updateUserMock: vi.fn(),
  deleteUserMock: vi.fn(),
  createUserMock: vi.fn(),
  setCustomUserClaimsMock: vi.fn(),
  deleteEnterpriseMemberMock: vi.fn(),
  deleteUserDocumentsMock: vi.fn(),
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
  onCall: (...args: unknown[]) => (args.length === 1 ? args[0] : args[1]),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    updateUser: updateUserMock,
    tenantManager: () => ({
      authForTenant: () => ({ updateUser: updateUserMock }),
    }),
  }),
}))

vi.mock('../stores/enterprise.js', () => ({
  countActiveEnterpriseAdmins: vi.fn(),
  deleteEnterpriseMember: (...args: unknown[]) => deleteEnterpriseMemberMock(...args),
  getEnterpriseById: vi.fn(),
  getEnterpriseMember: vi.fn(),
  getEnterpriseMemberUserIdByEmail: vi.fn(),
  listEnterpriseMembers: vi.fn(),
  saveEnterpriseMember: vi.fn(),
}))

vi.mock('../stores/user.js', () => ({
  deleteUserDocuments: (...args: unknown[]) => deleteUserDocumentsMock(...args),
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
  emailDomainMatches: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn(),
  normalizeEnterpriseEmail: (email: string) => email.trim().toLowerCase(),
}))

vi.mock('../utils/tenantAuth.js', () => ({
  authForEnterprise: vi.fn().mockResolvedValue({
    updateUser: updateUserMock,
    createUser: createUserMock,
    setCustomUserClaims: setCustomUserClaimsMock,
    deleteUser: deleteUserMock,
  }),
}))

vi.mock('../utils/logger.js', () => ({
  createModuleLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

import {
  getEnterpriseById,
  getEnterpriseMember,
  getEnterpriseMemberUserIdByEmail,
  saveEnterpriseMember,
} from '../stores/enterprise.js'
import { createEnterpriseMembers, updateEnterpriseMember } from './members.js'

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

type CreateEnterpriseMembersHandler = (req: {
  auth: { uid: string }
  data: {
    enterprise_id: string
    members: Array<{
      email: string
      display_name: string
      role?: 'admin' | 'member'
      department?: string
    }>
  }
  rawRequest: unknown
}) => Promise<{
  total: number
  success_count: number
  error_count: number
  results: Array<{ row: number; email: string; status: string; error_message?: string }>
}>

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

const callCreateEnterpriseMembers = (data: {
  enterprise_id: string
  members: Array<{
    email: string
    display_name: string
    role?: 'admin' | 'member'
    department?: string
  }>
}) =>
  (createEnterpriseMembers as unknown as CreateEnterpriseMembersHandler)({
    auth: { uid: 'admin-uid' },
    data,
    rawRequest: {},
  })

beforeEach(() => {
  getUserMock.mockReset()
  saveUserMock.mockReset()
  updateUserMock.mockReset()
  deleteUserMock.mockReset()
  createUserMock.mockReset()
  setCustomUserClaimsMock.mockReset()
  deleteEnterpriseMemberMock.mockReset()
  deleteUserDocumentsMock.mockReset()
  vi.mocked(getEnterpriseMember).mockReset()
  vi.mocked(saveEnterpriseMember).mockReset()
  vi.mocked(getEnterpriseById).mockReset()
  vi.mocked(getEnterpriseMemberUserIdByEmail).mockReset()

  vi.mocked(getEnterpriseMember).mockResolvedValue({
    id: 'member-uid',
    user_id: 'member-uid',
    display_name: '旧名前',
    role: 'member',
    is_active: true,
  } as never)
  saveUserMock.mockResolvedValue(undefined)
  updateUserMock.mockResolvedValue(undefined)
  deleteUserMock.mockResolvedValue(undefined)
  deleteEnterpriseMemberMock.mockResolvedValue(undefined)
  deleteUserDocumentsMock.mockResolvedValue(undefined)
  createUserMock.mockResolvedValue({ uid: 'new-member-uid' })
  setCustomUserClaimsMock.mockResolvedValue(undefined)
  vi.mocked(getEnterpriseById).mockResolvedValue({
    id: 'ent-a',
    allowed_email_domains: ['company.com'],
  } as never)
  vi.mocked(getEnterpriseMemberUserIdByEmail).mockResolvedValue(undefined)
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

describe('createEnterpriseMembers', () => {
  it('saveUser 失敗時に member / users と Auth を補償削除する', async () => {
    saveUserMock.mockRejectedValueOnce(new Error('saveUser failed'))

    const result = await callCreateEnterpriseMembers({
      enterprise_id: 'ent-a',
      members: [{ email: 'new@company.com', display_name: 'New User' }],
    })

    expect(result.success_count).toBe(0)
    expect(result.error_count).toBe(1)
    expect(deleteEnterpriseMemberMock).toHaveBeenCalledWith('ent-a', 'new-member-uid')
    expect(deleteUserDocumentsMock).toHaveBeenCalledWith('new-member-uid')
    expect(deleteUserMock).toHaveBeenCalledWith('new-member-uid')
  })

  it('saveEnterpriseMember 失敗時に Auth を補償削除する', async () => {
    vi.mocked(saveEnterpriseMember).mockRejectedValueOnce(new Error('saveEnterpriseMember failed'))

    const result = await callCreateEnterpriseMembers({
      enterprise_id: 'ent-a',
      members: [{ email: 'new@company.com', display_name: 'New User' }],
    })

    expect(result.success_count).toBe(0)
    expect(result.error_count).toBe(1)
    expect(saveUserMock).not.toHaveBeenCalled()
    expect(deleteEnterpriseMemberMock).toHaveBeenCalledWith('ent-a', 'new-member-uid')
    expect(deleteUserDocumentsMock).toHaveBeenCalledWith('new-member-uid')
    expect(deleteUserMock).toHaveBeenCalledWith('new-member-uid')
  })
})
