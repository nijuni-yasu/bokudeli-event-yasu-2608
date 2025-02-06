import { Timestamp } from 'firebase/firestore'

type LetterType = 'community' | 'event_participant' | 'event_non_participant'

export type Letter = {
  letter_id?: string
  community_account: string
  letter_type: LetterType
  event_id?: string
  letter_title: string
  letter_content: string
  status: 'draft' | 'timed' | 'sent'
  updated_at: Timestamp
  scheduled_at?: Timestamp
  sent_at?: Timestamp
}
