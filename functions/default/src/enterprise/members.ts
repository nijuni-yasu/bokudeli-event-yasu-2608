import { onCall, HttpsError } from 'firebase-functions/https'
import { DateTime } from 'luxon'
import {
  CreateEnterpriseMembersRequest,
  CreateEnterpriseMembersResponse,
  CreateEnterpriseMembersResultItem,
  DisableEnterpriseMemberRequest,
  DisableEnterpriseMemberResponse,
  EnableEnterpriseMemberRequest,
  EnableEnterpriseMemberResponse,
  GetEnterpriseMembersRequest,
  GetEnterpriseMembersResponse,
  EnterpriseMemberListItem,
  UpdateEnterpriseMemberRequest,
  UpdateEnterpriseMemberResponse,
} from '@shokujii/common/apis/enterprise.js'
import {
  EnterpriseMember,
  ENTERPRISE_MEMBER_ROLE_VALUES,
  type EnterpriseMemberRoleType,
} from '@shokujii/common/schemas/Enterprise.js'
import {
  countActiveEnterpriseAdmins,
  deleteEnterpriseMember,
  getEnterpriseById,
  getEnterpriseMember,
  getEnterpriseMemberUserIdByEmail,
  listEnterpriseMembers,
  saveEnterpriseMember,
} from '../stores/enterprise.js'
import { deleteUserDocuments, getUser, saveUser, ShokujiiUser } from '../stores/user.js'
import { writeAuditLog } from '../utils/auditLog.js'
import {
  assertEnterpriseAdmin,
  emailDomainMatches,
  getClientIp,
  normalizeEnterpriseEmail,
} from '../utils/enterpriseAuthHelpers.js'
import { createModuleLogger } from '../utils/logger.js'
import { authForEnterprise } from '../utils/tenantAuth.js'
import type { TenantAwareAuth } from 'firebase-admin/auth'

const logger = createModuleLogger('enterpriseMembers')

async function rollbackCreatedEnterpriseMember(
  enterpriseId: string,
  userId: string,
  email: string,
  tenantAuth: TenantAwareAuth,
): Promise<void> {
  try {
    await deleteEnterpriseMember(enterpriseId, userId)
  } catch (deleteMemberError) {
    logger.error('createEnterpriseMemberRollbackDeleteMemberFailed', {
      enterpriseId,
      email,
      userId,
      deleteMemberError,
    })
  }
  try {
    await deleteUserDocuments(userId)
  } catch (deleteUserDocsError) {
    logger.error('createEnterpriseMemberRollbackDeleteUserDocumentsFailed', {
      enterpriseId,
      email,
      userId,
      deleteUserDocsError,
    })
  }
  try {
    await tenantAuth.deleteUser(userId)
  } catch (deleteUserError) {
    logger.error('createEnterpriseMemberRollbackDeleteUserFailed', { enterpriseId, email, deleteUserError })
  }
}

const MAX_MEMBERS_PER_REQUEST = 500
const BATCH_CONCURRENCY = 10
const DEFAULT_PAGE_SIZE = 50

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let index = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      await fn(items[currentIndex]!, currentIndex)
    }
  })
  await Promise.all(workers)
}

type CreateMemberInput = CreateEnterpriseMembersRequest['members'][number] & { row: number }

async function validateCreateMemberRow(
  enterpriseId: string,
  allowedDomains: string[],
  row: CreateMemberInput,
  seenEmails: Set<string>,
): Promise<string | undefined> {
  const email = normalizeEnterpriseEmail(row.email)
  if (!isValidEmail(email)) {
    return 'メールアドレスの形式が正しくありません'
  }
  if (!emailDomainMatches(email, allowedDomains)) {
    return '許可されていないメールドメインです'
  }
  if (row.display_name.trim() === '') {
    return '表示名は必須です'
  }
  const role = row.role ?? 'member'
  if (!ENTERPRISE_MEMBER_ROLE_VALUES.includes(role)) {
    return 'ロールが不正です'
  }
  if (seenEmails.has(email)) {
    return 'このメールアドレスは既に登録済みです'
  }
  seenEmails.add(email)

  const existingMemberId = await getEnterpriseMemberUserIdByEmail(enterpriseId, email)
  if (existingMemberId != null) {
    return 'このメールアドレスは既に登録済みです'
  }
  return undefined
}

async function createSingleEnterpriseMember(
  enterpriseId: string,
  row: CreateMemberInput,
  tenantAuth: TenantAwareAuth,
): Promise<CreateEnterpriseMembersResultItem> {
  const email = normalizeEnterpriseEmail(row.email)
  const role: EnterpriseMemberRoleType = row.role ?? 'member'
  const displayName = row.display_name.trim()
  const department = row.department?.trim() !== '' ? row.department?.trim() : undefined

  try {
    const now = Date.now()
    const authUser = await tenantAuth.createUser({
      email,
      emailVerified: true,
      displayName,
    })

    try {
      await tenantAuth.setCustomUserClaims(authUser.uid, {
        enterprise_id: enterpriseId,
        enterprise_role: role,
        user_type: 'enterprise',
      })

      const member = new EnterpriseMember(authUser.uid, {
        user_email: email,
        role,
        is_active: true,
        last_activated_at: now,
        last_deactivated_at: null,
        display_name: displayName,
        department,
        monthly_usage: {},
        monthly_order_count: {},
        created_at: now,
      })

      await saveEnterpriseMember(member, enterpriseId)

      await saveUser(
        new ShokujiiUser(authUser.uid, {
          user_name: displayName,
          user_type: 'enterprise',
          enterprise_id: enterpriseId,
          user_email: email,
          created_at: now,
        }),
      )
    } catch (innerError) {
      await rollbackCreatedEnterpriseMember(enterpriseId, authUser.uid, email, tenantAuth)
      throw innerError
    }

    return { row: row.row, email, status: 'success' }
  } catch (error) {
    logger.error('createEnterpriseMemberRowFailed', { enterpriseId, email, error })
    return {
      row: row.row,
      email,
      status: 'error',
      error_message: 'アカウントの作成に失敗しました',
    }
  }
}

export const createEnterpriseMembers = onCall<CreateEnterpriseMembersRequest, Promise<CreateEnterpriseMembersResponse>>(
  { timeoutSeconds: 300 },
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const uid = request.auth!.uid
    const { enterprise_id: enterpriseId, members } = request.data

    if (enterpriseId == null || members == null || members.length === 0) {
      throw new HttpsError('invalid-argument', 'members is required')
    }
    if (members.length > MAX_MEMBERS_PER_REQUEST) {
      throw new HttpsError('invalid-argument', `members must be at most ${MAX_MEMBERS_PER_REQUEST}`)
    }

    const enterprise = await getEnterpriseById(enterpriseId)
    if (enterprise == null) {
      throw new HttpsError('not-found', 'enterprise not found')
    }

    const seenEmails = new Set<string>()
    const rows: CreateMemberInput[] = members.map((member, index) => ({ ...member, row: index + 1 }))
    const validationResults: CreateEnterpriseMembersResultItem[] = []
    const validRows: CreateMemberInput[] = []

    for (const row of rows) {
      const errorMessage = await validateCreateMemberRow(
        enterpriseId,
        enterprise.allowed_email_domains,
        row,
        seenEmails,
      )
      if (errorMessage != null) {
        validationResults.push({
          row: row.row,
          email: normalizeEnterpriseEmail(row.email),
          status: 'error',
          error_message: errorMessage,
        })
      } else {
        validRows.push(row)
      }
    }

    const tenantAuth = await authForEnterprise(enterpriseId)
    const createResults: CreateEnterpriseMembersResultItem[] = []
    await runWithConcurrency(validRows, BATCH_CONCURRENCY, async (row) => {
      const result = await createSingleEnterpriseMember(enterpriseId, row, tenantAuth)
      createResults.push(result)
      if (result.status === 'success') {
        await writeAuditLog({
          enterpriseId,
          userId: uid,
          action: 'account_create',
          targetId: undefined,
          targetType: 'member',
          ipAddress: getClientIp(request.rawRequest),
          details: { email: result.email, role: row.role ?? 'member' },
        })
      }
    })

    const results = [...validationResults, ...createResults].sort((a, b) => a.row - b.row)
    const successCount = results.filter((r) => r.status === 'success').length

    return {
      total: members.length,
      success_count: successCount,
      error_count: members.length - successCount,
      results,
    }
  },
)

function filterAndSortMembers(
  items: EnterpriseMemberListItem[],
  params: GetEnterpriseMembersRequest,
): EnterpriseMemberListItem[] {
  let filtered = items

  const search = params.search?.trim().toLowerCase()
  if (search != null && search !== '') {
    filtered = filtered.filter(
      (m) => m.display_name.toLowerCase().startsWith(search) || m.email.toLowerCase().includes(search),
    )
  }

  if (params.role != null && params.role !== 'all') {
    filtered = filtered.filter((m) => m.role === params.role)
  }

  if (params.is_active != null) {
    filtered = filtered.filter((m) => m.is_active === params.is_active)
  }

  const sortBy = params.sort_by ?? 'created_at'
  const sortOrder = params.sort_order ?? 'desc'
  const direction = sortOrder === 'asc' ? 1 : -1
  const currentYearMonth = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-MM')

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'display_name':
        cmp = a.display_name.localeCompare(b.display_name, 'ja')
        break
      case 'department':
        cmp = (a.department ?? '').localeCompare(b.department ?? '', 'ja')
        break
      case 'role':
        cmp = a.role.localeCompare(b.role)
        break
      case 'is_active':
        cmp = Number(a.is_active) - Number(b.is_active)
        break
      case 'monthly_usage':
        cmp = (a.monthly_usage[currentYearMonth] ?? 0) - (b.monthly_usage[currentYearMonth] ?? 0)
        break
      case 'created_at':
      default:
        cmp = a.created_at - b.created_at
        break
    }
    return cmp * direction
  })

  return filtered
}

export const getEnterpriseMembers = onCall<GetEnterpriseMembersRequest, Promise<GetEnterpriseMembersResponse>>(
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const { enterprise_id: enterpriseId } = request.data

    const members = await listEnterpriseMembers(enterpriseId)
    const joined: EnterpriseMemberListItem[] = members.map((member) => ({
      user_id: member.user_id,
      display_name: member.display_name ?? '',
      department: member.department,
      role: member.role,
      is_active: member.is_active,
      email: member.user_email,
      monthly_usage: member.monthly_usage ?? {},
      created_at: member.created_at,
    }))

    const filtered = filterAndSortMembers(joined, request.data)
    const totalCount = filtered.length
    const page = Math.max(1, request.data.page ?? 1)
    const pageSize = Math.max(1, request.data.page_size ?? DEFAULT_PAGE_SIZE)
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    return {
      members: paged,
      total_count: totalCount,
    }
  },
)

export const disableEnterpriseMember = onCall<DisableEnterpriseMemberRequest, Promise<DisableEnterpriseMemberResponse>>(
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const uid = request.auth!.uid
    const { enterprise_id: enterpriseId, user_id: userId } = request.data

    if (userId == null) {
      throw new HttpsError('invalid-argument', 'user_id is required')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'member not found')
    }

    if (member.role === 'admin' && member.is_active) {
      const activeAdminCount = await countActiveEnterpriseAdmins(enterpriseId)
      if (activeAdminCount <= 1) {
        throw new HttpsError('failed-precondition', '最低1人の有効な管理者が必要です')
      }
    }

    const tenantAuth = await authForEnterprise(enterpriseId)
    await tenantAuth.updateUser(userId, { disabled: true })
    await tenantAuth.revokeRefreshTokens(userId)

    const now = Date.now()
    member.is_active = false
    member.last_deactivated_at = now
    await saveEnterpriseMember(member, enterpriseId)

    await writeAuditLog({
      enterpriseId,
      userId: uid,
      action: 'account_disable',
      targetId: userId,
      targetType: 'member',
      ipAddress: getClientIp(request.rawRequest),
    })

    return { success: true }
  },
)

export const enableEnterpriseMember = onCall<EnableEnterpriseMemberRequest, Promise<EnableEnterpriseMemberResponse>>(
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const uid = request.auth!.uid
    const { enterprise_id: enterpriseId, user_id: userId } = request.data

    if (userId == null) {
      throw new HttpsError('invalid-argument', 'user_id is required')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'member not found')
    }

    const tenantAuth = await authForEnterprise(enterpriseId)
    await tenantAuth.updateUser(userId, { disabled: false })

    const now = Date.now()
    member.is_active = true
    member.last_activated_at = now
    await saveEnterpriseMember(member, enterpriseId)

    await writeAuditLog({
      enterpriseId,
      userId: uid,
      action: 'account_enable',
      targetId: userId,
      targetType: 'member',
      ipAddress: getClientIp(request.rawRequest),
    })

    return { success: true }
  },
)

export const updateEnterpriseMember = onCall<UpdateEnterpriseMemberRequest, Promise<UpdateEnterpriseMemberResponse>>(
  async (request) => {
    await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
    const uid = request.auth!.uid
    const { enterprise_id: enterpriseId, user_id: userId, display_name: displayName, department } = request.data

    if (userId == null || displayName == null) {
      throw new HttpsError('invalid-argument', 'user_id and display_name are required')
    }
    if (displayName.trim() === '') {
      throw new HttpsError('invalid-argument', 'display_name is required')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'member not found')
    }

    const trimmedName = displayName.trim()
    const trimmedDepartment = department?.trim() !== '' ? department?.trim() : undefined

    member.display_name = trimmedName
    member.department = trimmedDepartment
    await saveEnterpriseMember(member, enterpriseId)

    const user = await getUser(userId, true)
    if (user != null) {
      user.user_name = trimmedName
      await saveUser(user)
    }

    const tenantAuth = await authForEnterprise(enterpriseId)
    await tenantAuth.updateUser(userId, { displayName: trimmedName })

    await writeAuditLog({
      enterpriseId,
      userId: uid,
      action: 'member_update',
      targetId: userId,
      targetType: 'member',
      ipAddress: getClientIp(request.rawRequest),
      details: { display_name: trimmedName, department: trimmedDepartment ?? null },
    })

    return { success: true }
  },
)
