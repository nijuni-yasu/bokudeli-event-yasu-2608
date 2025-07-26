import _ from 'lodash'
import type { DocumentData, DocumentReference, Timestamp } from 'firebase/firestore'
import { generateRandomAccount } from '@shokujii/base/utils/generateRandomAccount'
import { COMMUNITY_DEFAULT_IMAGE_SETS } from '@shokujii/base/utils/defaultImages'

class BokudeliCommunity {
  is_approved: boolean = true
  community_manager_fullname: string = ''
  community_company: string = ''
  community_postalcode: string = ''
  community_address: string = ''
  community_phone: string = ''
  community_email: string = ''
  community_use_purpose: string = ''
  community_id: string = ''
  community_name: string = ''
  community_account: string = ''
  community_cover_image_url: string = ''
  community_icon_image_url: string = ''
  community_desc: string = ''
  community_sns_facebook: string = ''
  community_sns_twitter: string = ''
  community_sns_instagram: string = ''
  community_sns_officialsite: string = ''
  community_sns_hash_tag: string = ''
  community_bill_fullname: string = ''
  community_bill_email: string = ''
  is_public: boolean = true
  updated_at: Timestamp | null = null
  subdomain_tags: string[] = []
  is_show_member: boolean = true

  members: DocumentReference[] = []
  community_num_members: number = 0
  managers: DocumentReference[] = []

  constructor(communityData?: DocumentData) {
    if (communityData != null) {
      _.merge(this, communityData)
    }
  }

  /**
   * 新規コミュニティ作成用のファクトリーメソッド
   * デフォルト値を設定したBokudeliCommunityインスタンスを返す
   */
  static createNew(): BokudeliCommunity {
    const community = new BokudeliCommunity()

    // ランダムなインデックスを生成（01~08のセットで同じ値を使用）
    const randomIndex = Math.floor(Math.random() * COMMUNITY_DEFAULT_IMAGE_SETS.length)

    // デフォルト値を設定
    community.community_cover_image_url = COMMUNITY_DEFAULT_IMAGE_SETS[randomIndex].cover
    community.community_icon_image_url = COMMUNITY_DEFAULT_IMAGE_SETS[randomIndex].icon
    community.community_account = generateRandomAccount()

    return community
  }

  convertToDocumentData(): DocumentData {
    return _.omit(this, [
      // functions で計算するので含めない
      'members',
      'community_num_members',
      'managers',
    ])
  }
}

export default BokudeliCommunity
