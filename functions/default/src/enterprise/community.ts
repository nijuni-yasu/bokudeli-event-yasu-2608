import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/https'
import {
  CreateEnterpriseCommunitiesRequest,
  CreateEnterpriseCommunitiesResponse,
  CreateEnterpriseCommunitiesResultItem,
  GetEnterpriseCommunitiesRequest,
  GetEnterpriseCommunitiesResponse,
} from '@shokujii/common/apis/enterprise.js'
import {
  getCommunityByAccount,
  listCommunitiesByEnterpriseId,
  saveCommunity,
  setCommunityMemberWithRoles,
  ShokujiiCommunity,
} from '../stores/community.js'
import { getEnterpriseMember, getEnterpriseMembersCollectionRef } from '../stores/enterprise.js'
import { getUserIdFromEmail } from '../stores/user.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { assertEnterpriseAdmin, getClientIp, normalizeEnterpriseEmail } from '../utils/enterpriseAuthHelpers.js'
import { createModuleLogger } from '../utils/logger.js'

const logger = createModuleLogger('enterpriseCommunity')

const MAX_COMMUNITIES_PER_REQUEST = 100
const DEFAULT_PAGE_SIZE = 50
const COMMUNITY_ACCOUNT_PATTERN = /^[a-z0-9-]+$/

type CreateCommunityInput = CreateEnterpriseCommunitiesRequest['communities'][number] & { row: number }

async function validateCreateCommunityRow(
  enterpriseId: string,
  row: CreateCommunityInput,
  seenAccounts: Set<string>,
): Promise<string | undefined> {
  const communityName = row.community_name.trim()
  if (communityName === '' || communityName.length > 100) {
    return 'コミュニティ名は1〜100文字で入力してください'
  }

  const account = row.community_account.trim().toLowerCase()
  if (!COMMUNITY_ACCOUNT_PATTERN.test(account)) {
    return 'アカウント名は半角英数字とハイフンのみ使用できます'
  }
  if (seenAccounts.has(account)) {
    return '同一CSV内でアカウント名が重複しています'
  }
  seenAccounts.add(account)

  const existing = await getCommunityByAccount(account)
  if (existing != null) {
    return 'このアカウント名は既に使用されています'
  }

  const managerEmail = normalizeEnterpriseEmail(row.manager_email)
  const managerUserId = await getUserIdFromEmail(managerEmail)
  if (managerUserId == null) {
    return '指定された管理者メールアドレスは登録されていません'
  }

  const managerMember = await getEnterpriseMember(enterpriseId, managerUserId)
  if (managerMember == null) {
    return '指定された管理者は自社メンバーではありません'
  }
  if (!managerMember.is_active) {
    return '指定された管理者は無効化されています'
  }

  return undefined
}

async function createSingleEnterpriseCommunity(
  enterpriseId: string,
  row: CreateCommunityInput,
): Promise<CreateEnterpriseCommunitiesResultItem> {
  const communityName = row.community_name.trim()
  const communityAccount = row.community_account.trim().toLowerCase()

  try {
    const managerEmail = normalizeEnterpriseEmail(row.manager_email)
    const managerUserId = await getUserIdFromEmail(managerEmail)
    if (managerUserId == null) {
      return {
        row: row.row,
        community_name: communityName,
        status: 'error',
        error_message: '指定された管理者メールアドレスは登録されていません',
      }
    }

    const db = getFirestore()
    const communityId = db.collection('communities').doc().id
    const now = Date.now()

    const community = new ShokujiiCommunity(communityId, {
      community_name: communityName,
      community_account: communityAccount,
      community_desc: row.description?.trim() ?? '',
      enterprise_id: enterpriseId,
      is_public: true,
      is_approved: true,
      is_show_member: true,
      subdomain_tags: [],
      created_at: now,
    })

    await saveCommunity(community)
    await setCommunityMemberWithRoles(communityId, managerUserId, ['manager'])

    return { row: row.row, community_name: communityName, status: 'success' }
  } catch (error) {
    logger.error('createEnterpriseCommunityRowFailed', { enterpriseId, communityAccount, error })
    return {
      row: row.row,
      community_name: communityName,
      status: 'error',
      error_message: 'コミュニティの作成に失敗しました',
    }
  }
}

export const getEnterpriseCommunities = onCall<
  GetEnterpriseCommunitiesRequest,
  Promise<GetEnterpriseCommunitiesResponse>
>(async (request) => {
  await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
  const { enterprise_id: enterpriseId } = request.data

  const records = await listCommunitiesByEnterpriseId(enterpriseId)
  records.sort((a, b) => b.created_at - a.created_at)

  const memberNameByUserId = new Map<string, string>()
  const membersSnapshot = await getEnterpriseMembersCollectionRef(enterpriseId).get()
  for (const doc of membersSnapshot.docs) {
    const data = doc.data()
    memberNameByUserId.set(data.user_id, data.display_name ?? '')
  }

  const communities = records.map((record) => ({
    community_id: record.community_id,
    community_name: record.community_name,
    community_account: record.community_account,
    community_num_members: record.community_num_members,
    created_at: record.created_at,
    manager_display_names: record.manager_ids
      .map((id) => memberNameByUserId.get(id))
      .filter((name): name is string => name != null && name !== ''),
  }))

  const totalCount = communities.length
  const page = Math.max(1, request.data.page ?? 1)
  const pageSize = Math.max(1, request.data.page_size ?? DEFAULT_PAGE_SIZE)
  const start = (page - 1) * pageSize

  return {
    communities: communities.slice(start, start + pageSize),
    total_count: totalCount,
  }
})

export const createEnterpriseCommunities = onCall<
  CreateEnterpriseCommunitiesRequest,
  Promise<CreateEnterpriseCommunitiesResponse>
>({ timeoutSeconds: 300 }, async (request) => {
  await assertEnterpriseAdmin(request.auth, request.data.enterprise_id)
  const uid = request.auth!.uid
  const { enterprise_id: enterpriseId, communities } = request.data

  if (enterpriseId == null || communities == null || communities.length === 0) {
    throw new HttpsError('invalid-argument', 'communities is required')
  }
  if (communities.length > MAX_COMMUNITIES_PER_REQUEST) {
    throw new HttpsError('invalid-argument', `communities must be at most ${MAX_COMMUNITIES_PER_REQUEST}`)
  }

  const seenAccounts = new Set<string>()
  const rows: CreateCommunityInput[] = communities.map((community, index) => ({ ...community, row: index + 1 }))
  const validationResults: CreateEnterpriseCommunitiesResultItem[] = []
  const validRows: CreateCommunityInput[] = []

  for (const row of rows) {
    const errorMessage = await validateCreateCommunityRow(enterpriseId, row, seenAccounts)
    if (errorMessage != null) {
      validationResults.push({
        row: row.row,
        community_name: row.community_name.trim(),
        status: 'error',
        error_message: errorMessage,
      })
    } else {
      validRows.push(row)
    }
  }

  const createResults: CreateEnterpriseCommunitiesResultItem[] = []
  for (const row of validRows) {
    const result = await createSingleEnterpriseCommunity(enterpriseId, row)
    createResults.push(result)
    if (result.status === 'success') {
      await writeAuditLog({
        enterpriseId,
        userId: uid,
        action: 'community_create',
        targetType: 'community',
        ipAddress: getClientIp(request.rawRequest),
        details: {
          community_name: result.community_name,
          community_account: row.community_account.trim().toLowerCase(),
        },
      })
    }
  }

  const results = [...validationResults, ...createResults].sort((a, b) => a.row - b.row)
  const successCount = results.filter((r) => r.status === 'success').length

  return {
    total: communities.length,
    success_count: successCount,
    error_count: communities.length - successCount,
    results,
  }
})
