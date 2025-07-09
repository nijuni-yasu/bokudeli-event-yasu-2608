import { type DocumentData, Timestamp } from 'firebase/firestore'
import _ from 'lodash'
import { buildThumbnailsLinks, type ThumbnailLinks } from '@/composable/buildThumbnailsLinks'

/**
 * StoredUser は getAuth().user から id のみ取得し、 currentUser の ID のみを持つ type とする。
 * 他の情報は FirestoredUser で保持することとする。
 * TODO: userId 以外のプロパティを削除する
 */
export type StoredUser = {
  userId: string
  userName: string
  userEmail: string
  userEmailPending: string | null
  userImageUrl: string | null
  userAccount: string | null
  userDescription: string | null
  userSnsGoogle: string | null
  userSnsFacebook: string | null
  userSnsFacebookName: string | null
  userSnsTwitter: string | null
  userSnsTwitterAccessToken: string | null
  userSnsTwitterSecret: string | null
  userSnsInstagram: string | null
  userSnsWebsite: string | null
  userPassCode: string | null
  verifiedAt: Date | null
  createdAt: Date | undefined
  updatedAt: Date | undefined
}

export class FirestoredUser {
  user_id: string = ''
  user_name: string = ''
  user_image_url: string | null = null
  user_account: string | null = null
  user_description: string | null = null
  user_sns_facebook: string | null = null
  user_sns_facebook_name: string | null = null
  user_sns_twitter: string | null = null
  user_sns_instagram: string | null = null
  user_sns_website: string | null = null
  user_pass_code: string | null = null
  verified_at: Timestamp | null = null
  created_at: Timestamp | null = null
  updated_at: Timestamp | null = null
  user_thumb_image_urls: ThumbnailLinks | null = null

  constructor(data?: DocumentData) {
    if (data != null) {
      _.merge(this, data)

      if (data?.user_id != null && data?.user_image_url != null) {
        try {
          this.user_thumb_image_urls = buildThumbnailsLinks(data.user_id, new URL(data.user_image_url))
        } catch {
          // Do nothing
        }
      }
    }
  }

  convertToDocumentData(): DocumentData {
    return _.omit(this, [
      'user_email',
      'user_email_pending',
      'user_sns_google',
      'user_sns_twitter_access_token',
      'user_sns_twitter_secret',
      'user_thumb_image_urls',
    ])
  }
}

export type FirestoredUserPersonalInformation = {
  user_email: string
  user_email_pending: string | null
  user_sns_google: string | null
  user_sns_twitter_access_token: string | null
  user_sns_twitter_secret: string | null
}
