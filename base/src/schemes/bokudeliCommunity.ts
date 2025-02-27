import _ from 'lodash'
import type { DocumentData, DocumentReference, Timestamp } from 'firebase/firestore'

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
  is_public: boolean = true
  updated_at: Timestamp | null = null
  subdomain_tags: string[] = []

  members: DocumentReference[] = []
  community_num_members: number = 0
  managers: DocumentReference[] = []

  constructor(communityData?: DocumentData) {
    if (communityData != null) {
      _.merge(this, communityData)
    }
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
