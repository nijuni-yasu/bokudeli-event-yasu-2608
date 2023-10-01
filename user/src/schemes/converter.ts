import { format } from 'date-fns'
import { DocumentData, Timestamp } from 'firebase/firestore'
import BokudeliEvent, { defaultPayment } from './bokudeliEvent'
import BokudeliCommunity from './bokudeliCommunity'
import PartnerMenu from './partnerMenu'
import { FacebookAuthProvider, GoogleAuthProvider, User } from 'firebase/auth'
import StoredUser, { FirestoredUser } from './storedUser'
import { useStoreCredential } from '@/stores/credential'
import axios from 'axios'

export const dateString = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

export const dateWithDayOfWeekString = (date: Date | null): string => {
  if (!date) return ''
  return formatDateWithDayOfWeek(date)
}
function formatDateWithDayOfWeek(date: Date) {
  const options: any = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short', // 曜日を短縮形で表示 (例: 金)
  }
  const formattedDate = date.toLocaleDateString('ja-JP', options)
  return formattedDate
}

export const priceString = (price: number): string => {
  return `¥${price.toLocaleString()}`
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
    is_public,
    event_payment,
    // event_payer,
    // is_payment_advance_by_user,
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
    isPublic: is_public ?? false,
    eventPayment: event_payment ?? defaultPayment.eventPayment,
    // eventPayer: event_payer ?? defaultPayment.eventPayer,
    // isPaymentAdvanceByUser: is_payment_advance_by_user ?? defaultPayment.isPaymentAdvanceByUser,
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
    is_public,
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
    isPublic: is_public ?? false,
  }
}

export const convertDocumentDataToMenu = (
  partnerId: string,
  documentId: string,
  documentData: DocumentData,
): PartnerMenu => {
  const {
    menu_name,
    menu_price,
    menu_image_url,
    menu_description,
    createdAt,
    updatedAt,
    is_soldout,
    menu_date_start,
    menu_date_end,
  } = documentData

  return {
    id: documentId,
    partnerId,
    name: menu_name ?? '',
    price: menu_price ?? 0,
    imageUrl: menu_image_url ?? '',
    description: menu_description ?? '',
    createdAt: createdAt ? (createdAt as Timestamp).toDate() : null,
    updatedAt: updatedAt ? (updatedAt as Timestamp).toDate() : null,
    isSoldout: is_soldout ?? false,
    dateStart: menu_date_start ?? '',
    dateEnd: menu_date_end ?? '',
  }
}

export const convertFirebaseUserToStoredUser = async (firebaseUser: User): Promise<StoredUser> => {
  const { uid, displayName, email, photoURL, providerData } = firebaseUser

  const user: StoredUser = {
    userId: uid,
    userName: displayName ?? '',
    userEmail: email ?? '',
    userImageUrl: photoURL ?? '',
    userAccount: null,
    userDescription: null,
    userSnsFacebook: null,
    userSnsTwitter: null,
    userSnsInstagram: null,
    createdAt: undefined,
    updatedAt: undefined,
  }

  // 各IDプロバイダー毎の処理
  for (const provider of providerData) {
    switch (provider.providerId) {
      case FacebookAuthProvider.PROVIDER_ID:
        {
          const store = useStoreCredential()
          if (store.credential) {
            const imageQueryUrl =
              photoURL + `?width=200&height=200&redirect=false&access_token=${store.credential.accessToken}`
            const response = await axios.get(imageQueryUrl)

            let newImageUrl = null
            if (response.data.data.is_silhouette === false) {
              newImageUrl = response.data.data.url
            }
            user.userImageUrl = newImageUrl
          }
        }
        break
      case GoogleAuthProvider.PROVIDER_ID:
      default:
        break
    }
  }

  return user
}

export const convertStoredUserToFirestoredUser = (storedUser: StoredUser): FirestoredUser => {
  return {
    user_id: storedUser.userId,
    user_name: storedUser.userName,
    user_email: storedUser.userEmail,
    user_image_url: storedUser.userImageUrl,
    user_account: storedUser.userAccount,
    user_description: storedUser.userDescription,
    user_sns_facebook: storedUser.userSnsFacebook,
    user_sns_twitter: storedUser.userSnsTwitter,
    user_sns_instagram: storedUser.userSnsInstagram,
    created_at: storedUser.createdAt ? Timestamp.fromDate(storedUser.createdAt) : Timestamp.now(),
    updated_at: storedUser.updatedAt ? Timestamp.fromDate(storedUser.updatedAt) : Timestamp.now(),
  }
}

export const convertDocumentDataToStoredUser = (documentData: DocumentData | undefined): StoredUser => {
  if (!documentData) {
    return {
      userId: '',
      userName: '',
      userEmail: '',
      userImageUrl: '',
      userAccount: null,
      userDescription: null,
      userSnsFacebook: null,
      userSnsTwitter: null,
      userSnsInstagram: null,
      createdAt: undefined,
      updatedAt: undefined,
    }
  }

  const {
    user_id,
    user_name,
    user_email,
    user_image_url,
    user_account,
    user_description,
    user_sns_facebook,
    user_sns_twitter,
    user_sns_instagram,
    created_at,
    updated_at,
  } = documentData

  return {
    userId: user_id ?? '',
    userName: user_name ?? '',
    userEmail: user_email ?? '',
    userImageUrl: user_image_url ?? '',
    userAccount: user_account ?? '',
    userDescription: user_description ?? '',
    userSnsFacebook: user_sns_facebook ?? '',
    userSnsTwitter: user_sns_twitter ?? '',
    userSnsInstagram: user_sns_instagram ?? '',
    createdAt: created_at ? (created_at as Timestamp).toDate() : undefined,
    updatedAt: updated_at ? (updated_at as Timestamp).toDate() : undefined,
  }
}
