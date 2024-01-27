import _ from 'lodash'
import type { DocumentData, DocumentReference, Timestamp } from "firebase/firestore"

class BokudeliCommunity {
  community_id: string = '';
  community_name: string = '';
  community_account: string = '';
  community_cover_image_url: string = '';
  community_icon_image_url: string = '';
  community_desc: string = '';
  community_sns_facebook: string = '';
  community_sns_twitter: string = '';
  community_sns_instagram: string = '';
  community_sns_officialsite: string = '';
  is_public: boolean = false;
  updated_at: Timestamp | null = null;

  members?: DocumentReference[] = [];

  constructor(communityData?: DocumentData) {
    if (communityData != null) {
      _.merge(this, communityData, {
        // 過去の community_status が設定されていないデータは全て accepted とする
        community_status: communityData.community_status ?? 'accepted',
      })
    }
  }

  convertToDocumentData(): DocumentData {
    return _.merge({}, this)
  }
}

export default BokudeliCommunity
