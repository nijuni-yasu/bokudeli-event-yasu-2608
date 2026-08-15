import { z } from 'zod'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { DEFAULT_FROM, SUPPORT_MAIL, getCommunityManagerEmailSet } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import {
  getCommunityUrl,
  getCommunityUrlForCommunity,
  getManageCommunityUrl,
  getManageCommunityUrlForCommunity,
} from './utils/urls.js'
import { ShokujiiCommunity, getCommunity } from './stores/community.js'
import { isEnterpriseCommunity } from './utils/enterpriseMail.js'
import { getUser } from './stores/user.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('communityMail')

const COMMUNITY_ADD_ID = 'd-d116c6b010214d2b92a2421411a508d2'
const COMMUNITY_CONTACT_ID = 'd-940c5bd81040475e8c9522c80e361433'
const COMMUNITY_MANAGER_ADDED_TEMPLATE_ID = 'd-2a1283b5d17040dfb3805d6b4a0f922e'
const COMMUNITY_MANAGER_REMOVED_TEMPLATE_ID = 'd-019c40ece2e344ff9b4f6edb19dc7167'

// See: CommunityContactDialog.vue
const CommunityContactRequestSchema = z.object({
  community_id: z.string(),
  community_name: z.string(),
  mail_title: z.string(),
  mail_message: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  user_email: z.string(),
  user_profile_url: z.string(),
})

type CommunityContactRequest = z.infer<typeof CommunityContactRequestSchema>

/**
 * 対象メールアドレスリストを取得（マネージャーがいない場合はサポートメール）
 */
async function getEmailList(communityId: string): Promise<string[]> {
  const emailSet = await getCommunityManagerEmailSet(communityId)
  if (emailSet.size === 0) {
    // コミュマネがいない場合はsupport+to@nijuni.jpに送信
    return [SUPPORT_MAIL]
  }
  return Array.from(emailSet)
}

export async function sendCommunityAddedMailToOrganizer(
  templateId: string,
  community: ShokujiiCommunity,
): Promise<void[]> {
  const emails = await getEmailList(community.id)
  if (!emails.includes(SUPPORT_MAIL)) {
    emails.push(SUPPORT_MAIL)
  }
  const community_account = community.community_account
  const community_name = community.community_name
  const community_url = await getCommunityUrlForCommunity(community)
  const community_manage_url = await getManageCommunityUrlForCommunity(community)
  if (isEnterpriseCommunity(community) && (community_url == null || community_manage_url == null)) {
    logger.error('Enterprise host unresolved for community added mail', {
      communityId: community.id,
      enterpriseId: community.enterprise_id,
    })
  }
  return Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId,
        dynamicTemplateData: {
          community_account,
          community_name,
          community_url: community_url ?? '',
          community_manage_url: community_manage_url ?? '',
        },
      })
    }),
  )
}

/**
 * コミュニティマネージャーの追加・削除通知メール。
 * legacy `on_write_community_members` の sendMessage 相当。
 */
export async function sendCommunityManagerRoleChangeMails(params: {
  communityAccount: string
  communityName: string
  addedManagerIds: string[]
  removedManagerIds: string[]
}): Promise<void> {
  const { communityAccount, communityName, addedManagerIds, removedManagerIds } = params
  const community_url = getCommunityUrl(communityAccount)
  const community_manage_url = getManageCommunityUrl(communityAccount)

  const sendToManager = async (templateId: string, managerId: string): Promise<void> => {
    const user = await getUser(managerId, true)
    const to = user?.user_email
    if (to == null || to === '') {
      return
    }
    await sgMail.send({
      to,
      from: DEFAULT_FROM,
      templateId,
      dynamicTemplateData: {
        user_name: user?.user_name ?? '',
        community_name: communityName,
        community_url,
        community_manage_url,
      },
    })
  }

  const sendPromises = [
    ...addedManagerIds.map((managerId) => sendToManager(COMMUNITY_MANAGER_ADDED_TEMPLATE_ID, managerId)),
    ...removedManagerIds.map((managerId) => sendToManager(COMMUNITY_MANAGER_REMOVED_TEMPLATE_ID, managerId)),
  ]
  if (sendPromises.length === 0) {
    return
  }

  const results = await Promise.allSettled(sendPromises)
  const failedCount = results.filter((r) => r.status === 'rejected').length
  if (failedCount > 0) {
    logger.warn('Failed to send community manager role change mails', {
      communityAccount,
      failedCount,
      successCount: results.length - failedCount,
      totalCount: results.length,
    })
  }
}

async function sendCommunityContactMailToOrganizers(
  templateId: string,
  data: CommunityContactRequest,
): Promise<void[]> {
  const community = await getCommunity(data.community_id)
  if (community == null) {
    throw new HttpsError('not-found', 'Community not found.')
  }
  const community_url = await getCommunityUrlForCommunity(community)
  if (community_url == null && isEnterpriseCommunity(community)) {
    throw new HttpsError('failed-precondition', 'enterprise host is not configured')
  }
  const emails = await getEmailList(data.community_id)
  const dynamicTemplateData = {
    ...data,
    community_url: community_url ?? '',
  }
  if (!emails.includes(SUPPORT_MAIL)) {
    emails.push(SUPPORT_MAIL)
  }
  return Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        replyTo: data.user_email,
        templateId,
        dynamicTemplateData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    }),
  )
}

export const communityAdded = onDocumentCreated(
  {
    document: 'communities/{communityId}',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async (event) => {
    if (event && event.data) {
      const community = new ShokujiiCommunity(event.data.id, event.data.data())
      return sendCommunityAddedMailToOrganizer(COMMUNITY_ADD_ID, community)
    } else {
      console.error('communityAdded event is undefined')
      throw new HttpsError('invalid-argument', 'event is undefined')
    }
  },
)

export const communityContact = onCall(
  {
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    if (request.auth) {
      const communityContactRequest = CommunityContactRequestSchema.parse(request.data) as CommunityContactRequest
      return sendCommunityContactMailToOrganizers(COMMUNITY_CONTACT_ID, communityContactRequest)
    } else {
      // console.log('community_contact Auth Error')
      // console.log(request.data)
      // console.log(request.auth)
      throw new HttpsError('permission-denied', 'community_contact Auth Error')
    }
  },
)
