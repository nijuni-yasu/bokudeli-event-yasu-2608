import { format } from 'date-fns'
import { DocumentData, Timestamp } from 'firebase/firestore'
import BokudeliEvent, { createEmptyEvent } from './bokudeliEvent'
import BokudeliCommunity from './bokudeliCommunity'
import PartnerMenu from './partnerMenu'
import { FacebookAuthProvider, GoogleAuthProvider, User } from 'firebase/auth'
import StoredUser, { FirestoredUser } from './storedUser'
import { useStoreCredential } from '@/stores/credential'
import axios from 'axios'

export const dateString = (date: Timestamp | Date | null): string => {
  if (!date) return ''

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  return format(targetDate, 'yyyy-MM-dd')
}

export const dateWithDayOfWeekString = (date: Timestamp | Date | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short', // 曜日を短縮形で表示 (例: 金)
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  const formattedDate = targetDate.toLocaleDateString('ja-JP', options)
  return formattedDate
}

export const dateOnlyTimeString = (date: Timestamp | Date | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  const formattedDate = targetDate.toLocaleTimeString('ja-JP', options)
  return formattedDate
}


export const priceString = (price: number): string => {
  return `¥${price.toLocaleString()}`
}

export const convertDocumentDataToEvent = (documentData: DocumentData): BokudeliEvent => {
  return {
    ...createEmptyEvent(),
    ...documentData,
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
