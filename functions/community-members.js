import functions from 'firebase-functions/v1'
import { getFirestore } from 'firebase-admin/firestore'
import sgMail from '@sendgrid/mail'
import { getCommunityUrl } from './utils/urls.js'
import { DEFAULT_FROM } from './utils/mail.js'

const COMMUNITY_MANAGER_ADDED_TEMPLATE_ID = 'd-2a1283b5d17040dfb3805d6b4a0f922e'
const COMMUNITY_MANAGER_REMOVED_TEMPLATE_ID = 'd-019c40ece2e344ff9b4f6edb19dc7167'

const db = getFirestore()
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendMessage = async (communitySnapshot, newManagers) => {
  const currentManagers = communitySnapshot.get('managers') ?? []
  const added = newManagers.filter((newManager) => !currentManagers.some((m) => m.id === newManager.id))
  const removed = currentManagers.filter((currentManager) => !newManagers.some((m) => m.id === currentManager.id))

  const community_name = communitySnapshot.get('community_name')
  const community_url = getCommunityUrl(communitySnapshot.get('community_account'))

  const send = async (templateId, manager) => {
    const managerSnapshot = await manager.get()
    const to = managerSnapshot.get('user_email')
    const user_name = managerSnapshot.get('user_name')
    if (to != null && to !== '') {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId,
        dynamic_template_data: {
          user_name,
          community_name,
          community_url,
        },
      })
    }
  }

  const addedPromise = added.map((manager) => send(COMMUNITY_MANAGER_ADDED_TEMPLATE_ID, manager))
  const removedPromise = removed.map((manager) => send(COMMUNITY_MANAGER_REMOVED_TEMPLATE_ID, manager))
  await Promise.all([...addedPromise, ...removedPromise])
}

const update_community_members = (_, context) =>
  db.runTransaction(async (transaction) => {
    const communityRef = db.collection('communities').doc(context.params.communityId)
    // 先にスナップショットを取得しておく
    const currentCommunitySnapshot = await transaction.get(communityRef)
    const membersRef = communityRef.collection('members')
    const membersSnapshot = await transaction.get(membersRef)
    const members = membersSnapshot.docs.map((member) => db.collection('users').doc(member.id))
    const managers = membersSnapshot.docs.flatMap((member) => {
      const isManager = member.get('roles')?.includes('manager') ?? false
      return isManager ? db.collection('users').doc(member.id) : []
    })
    transaction.update(communityRef, {
      community_num_members: members.length,
      members,
      managers,
    })
    await sendMessage(currentCommunitySnapshot, managers)
  })

export const on_write_community_members = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/members/{userId}')
  .onWrite(update_community_members)
