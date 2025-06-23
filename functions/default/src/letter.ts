import { onCall, HttpsError } from 'firebase-functions/https'
import { sendTestLetterRequestSchema } from './apis/letter.js'
import { getCommunity } from './stores/community.js'
import { getEvent } from './stores/event.js'
import { getLetter } from './stores/letter.js'
import { getUserPersonalInformation } from './stores/user.js'
import { DEFAULT_FROM } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getCommunityUrl, getEventUrl } from './utils/urls.js'
import { convertToDate } from './commonUtils/datetime.js'

const LETTER_ID = 'd-e1ca1ca620374bfeaf0697495dbacb20'

const generateDynamicTemplateData = async (communityId: string, letterId: string) => {
  const [letter, community] = await Promise.all([getLetter(communityId, letterId), getCommunity(communityId)])
  if (community === undefined) {
    throw new HttpsError('not-found', 'the community is not found.')
  }
  if (letter === undefined) {
    throw new HttpsError('not-found', 'the letter is not found.')
  }
  if (letter.status !== 'draft') {
    throw new HttpsError('invalid-argument', 'The letter status must be in draft.')
  }
  let eventInfo = {}
  if (letter.event_id !== undefined) {
    const event = await getEvent(letter.event_id)
    if (event !== undefined) {
      eventInfo = {
        event_name: event.event_name,
        event_url: getEventUrl(event.community_account, event.id),
        event_date: convertToDate(event.event_start_datetime),
      }
    }
  }
  return {
    subject: letter.letter_title,
    community_name: community.community_name,
    community_url: getCommunityUrl(community.community_account),
    letter_title: letter.letter_title,
    letter_content: letter.letter_content,
    letter_type: letter.letter_type,
    user_name: 'ユーザー名',
    ...eventInfo,
  }
}

export const sendTestLetter = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid === undefined) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
    }
    const { communityId, letterId } = sendTestLetterRequestSchema.parse(request.data)
    const to = (await getUserPersonalInformation(uid))?.user_email
    if (to === undefined) {
      throw new HttpsError('not-found', 'The user is not valid.')
    }
    await sgMail.send({
      to,
      from: DEFAULT_FROM,
      templateId: LETTER_ID,
      dynamicTemplateData: await generateDynamicTemplateData(communityId, letterId),
    })
  },
)
