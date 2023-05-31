import { Timestamp } from 'firebase/firestore'

type StoredUser = {
  userId: string
  userName: string
  userEmail: string
  userImageUrl: string | null
  userAccount: string | null
  userDescription: string | null
  userSnsFacebook: string | null
  userSnsTwitter: string | null
  createdAt: Date | undefined
  updatedAt: Date | undefined
}

export type FirestoredUser = {
  user_id: string
  user_name: string
  user_email: string
  user_image_url: string | null
  user_account: string | null
  user_description: string | null
  user_sns_facebook: string | null
  user_sns_twitter: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export default StoredUser
