import { format } from 'date-fns'
import { DocumentData, Timestamp } from 'firebase/firestore'
import BokudeliEvent from './bokudeliEvent'
import BokudeliCommunity from './bokudeliCommunity'
import PartnerMenu from './partnerMenu'
import { User } from 'firebase/auth'
import StoredUser, { FirestoredUser } from './storedUser'

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
  return new BokudeliEvent(documentData)
}

export const convertDocumentDataToCommunity = (documentData: DocumentData): BokudeliCommunity => {
  return new BokudeliCommunity(documentData)
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

export const convertFirebaseUserToStoredUser = (firebaseUser: User): StoredUser => {
  const { uid, displayName, email, photoURL } = firebaseUser

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

  return user
}

export const convertStoredUserToFirestoredUser = (storedUser: StoredUser): FirestoredUser => {
  return new FirestoredUser({
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
  })
}

export const convertFirestoredUserToStoredUser = (firestoredUser: FirestoredUser): StoredUser => {
  return {
    userId: firestoredUser.user_id,
    userName: firestoredUser.user_name,
    userEmail: firestoredUser.user_email,
    userImageUrl: firestoredUser.user_image_url,
    userAccount: firestoredUser.user_account,
    userDescription: firestoredUser.user_description,
    userSnsFacebook: firestoredUser.user_sns_facebook,
    userSnsTwitter: firestoredUser.user_sns_twitter,
    userSnsInstagram: firestoredUser.user_sns_instagram,
    createdAt: firestoredUser.created_at.toDate(),
    updatedAt: firestoredUser.updated_at.toDate(),
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

export const convertDateToWeekTimestamp = (date: Date): number => {
  return (
    date.getDay() * 24 * 60 * 60 * 1000 +
    date.getHours() * 60 * 60 * 1000 +
    date.getMinutes() * 60 * 1000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds()
  )
}

export const convertShopTimeToWeekTimestamp = (dayOfWeek: number, timeString: string): number => {
  const [hour, minute] = timeString.split(':').map((value) => parseInt(value))
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return NaN
  }
  return dayOfWeek * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000
}

export const convertTruncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + '...'
  } else {
    return text
  }
}
