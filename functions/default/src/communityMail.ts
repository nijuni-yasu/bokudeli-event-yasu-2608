import { z } from 'zod'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getCommunityUrl, getManageCommunityUrl } from './utils/urls.js'
import { getCommunity, ShokujiiCommunity } from './stores/community.js'
import { getUser } from './stores/user.js'

const COMMUNITY_ADD_ID = 'd-d116c6b010214d2b92a2421411a508d2'
const COMMUNITY_CONTACT_ID = 'd-940c5bd81040475e8c9522c80e361433'

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

async function getCommunityManagerEmailsSet(communityId: string): Promise<Set<string>> {
  // 重複するメールアドレスは追加しない
  const emails = new Set<string>()
  const community = await getCommunity(communityId)
  if (!community) {
    return emails
  }

  const members = await community.getMembersByRole('manager')
  await Promise.all(
    members.map(async (member) => {
      const user = await getUser(member.id, true)
      if (user?.user_email) {
        emails.add(user.user_email)
      }
    }),
  )
  return emails
}

async function getCommunityEmails(communityId: string): Promise<string[]> {
  const emails = await getCommunityManagerEmailsSet(communityId)
  if (emails.size === 0) {
    // コミュマネがいない場合はsupport+to@nijuni.jpに送信
    return [SUPPORT_MAIL]
  }
  return Array.from(emails)
}

async function sendCommunityAddedMailToOrganizer(templateId: string, community: ShokujiiCommunity): Promise<void[]> {
  const emails = await getCommunityEmails(community.id)
  if (!emails.includes(SUPPORT_MAIL)) {
    emails.push(SUPPORT_MAIL)
  }
  const community_account = community.community_account
  const community_name = community.community_name
  const community_url = getCommunityUrl(community_account)
  const community_manage_url = getManageCommunityUrl(community_account)
  return Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId,
        dynamicTemplateData: {
          community_account,
          community_name,
          community_url,
          community_manage_url,
        },
      })
    }),
  )
}

async function sendCommunityContactMailToOrganizers(
  templateId: string,
  data: CommunityContactRequest,
): Promise<void[]> {
  const emails = await getCommunityEmails(data.community_id)
  const dynamicTemplateData = data
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
      console.log('community_contact Auth Error')
      console.log(request.data)
      console.log(request.auth)
      throw new HttpsError('permission-denied', 'community_contact Auth Error')
    }
  },
)
