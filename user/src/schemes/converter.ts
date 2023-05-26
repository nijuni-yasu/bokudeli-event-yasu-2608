import { format } from 'date-fns'
import { DocumentData, Timestamp } from 'firebase/firestore'
import BokudeliEvent from './bokudeliEvent'
import BokudeliCommunity from './bokudeliCommunity'

export const dateString = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd HH:mm')
}

export const convertDocumentDataToEvent = (documentData: DocumentData): BokudeliEvent => {
  const {
    community_id,
    community_name,
    community_account,
    event_address,
    event_cover_url,
    event_deadline_datetime,
    event_desc,
    event_end_datetime,
    event_id,
    event_max_people,
    event_name,
    event_start_datetime,
    partner_id,
    shop_id,
    shop_name,
  } = documentData

  return {
    communityId: community_id ?? '',
    communityName: community_name ?? '',
    communityAccount: community_account ?? '',
    eventId: event_id ?? '',
    eventAddress: event_address ?? '',
    eventCoverUrl: event_cover_url ?? '',
    eventDescription: event_desc ?? '',
    eventDeadline: event_deadline_datetime ? (event_deadline_datetime as Timestamp).toDate() : null,
    eventMaxPeople: event_max_people ?? 0,
    eventName: event_name ?? '',
    eventStartDatetime: event_start_datetime ? (event_start_datetime as Timestamp).toDate() : null,
    eventEndDatetime: event_end_datetime ? (event_end_datetime as Timestamp).toDate() : null,
    partnerId: partner_id ?? '',
    shopId: shop_id ?? '',
    shopName: shop_name ?? '',
  }
}

export const convertDocumentDataToCommunity = (documentData: DocumentData): BokudeliCommunity => {
  const {
    community_id,
    community_name,
    community_account,
    community_cover_image_url,
    community_icon_image_url,
    community_desc,
    community_sns_officialsite,
    community_sns_facebook,
    community_sns_instagram,
    community_sns_twitter,
  } = documentData

  return {
    communityId: community_id ?? '',
    communityName: community_name ?? '',
    communityAccount: community_account ?? '',
    communityCoverImageUrl: community_cover_image_url ?? '',
    communityIconImageUrl: community_icon_image_url ?? '',
    communityDescription: community_desc ?? '',
    communitySns: {
      officialsite: community_sns_officialsite ?? '',
      facebook: community_sns_facebook ?? '',
      instagram: community_sns_instagram ?? '',
      twitter: community_sns_twitter ?? '',
    },
  }
}
