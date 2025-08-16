import { format } from 'date-fns'
import { type DocumentData, Timestamp } from 'firebase/firestore'
import { BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import { type User } from 'firebase/auth'
import { type StoredUser, FirestoredUser, type FirestoredUserPersonalInformation } from './storedUser'

export const dateString = (date: Timestamp | Date | null): string => {
  if (!date) return ''

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  return format(targetDate, 'yyyy-MM-dd')
}

export const dateWithDayOfWeekString = (date: Timestamp | Date | number | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short', // 曜日を短縮形で表示 (例: 金)
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : typeof date === 'number' ? new Date(date) : date
  const formattedDate = targetDate.toLocaleDateString('ja-JP', options)
  return formattedDate
}

export const dateOnlyTimeString = (date: Timestamp | Date | number | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : typeof date === 'number' ? new Date(date) : date
  const formattedDate = targetDate.toLocaleTimeString('ja-JP', options)
  return formattedDate
}

export const priceString = (price: number): string => {
  return `${price.toLocaleString()}`
}

export const postalcodeString = (postalCode: string): string => {
  // 郵便番号を「〒XXX-XXXX」の形式に変換
  return `〒${postalCode.slice(0, 3)}-${postalCode.slice(3)}`
}

// Deprecated
export const convertDocumentDataToMenu = (
  partnerId: string,
  documentId: string,
  documentData: DocumentData,
): BokudeliPartnerMenu => {
  const {
    menu_name,
    menu_price,
    menu_image_url,
    menu_description,
    updatedAt,
    is_soldout,
    menu_date_start,
    menu_date_end,
  } = documentData

  return new BokudeliPartnerMenu(partnerId, documentId, {
    menu_name: menu_name ?? '',
    menu_price: menu_price ?? 0,
    menu_image_url: menu_image_url ?? '',
    menu_description: menu_description ?? '',
    updatedAt: updatedAt,
    is_sold_out: is_soldout ?? false,
    menu_date_start: menu_date_start ?? null,
    menu_date_end: menu_date_end ?? null,
  })
}

export const convertFirebaseUserToStoredUser = (firebaseUser: User): StoredUser => {
  const { uid, displayName, email, photoURL } = firebaseUser

  const user: StoredUser = {
    userId: uid,
    userName: displayName ?? '',
    userEmail: email ?? '',
    userEmailPending: null,
    userImageUrl: photoURL ?? null,
    userAccount: null,
    userDescription: null,
    userSnsGoogle: null,
    userSnsFacebook: null,
    userSnsFacebookName: null,
    userSnsTwitter: null,
    userSnsTwitterAccessToken: null,
    userSnsTwitterSecret: null,
    userSnsInstagram: null,
    userSnsWebsite: null,
    userPassCode: null,
    verifiedAt: null,
    createdAt: undefined,
    updatedAt: undefined,
  }

  return user
}

export const convertStoredUserToFirestoredUser = (storedUser: StoredUser): FirestoredUser => {
  return new FirestoredUser({
    user_id: storedUser.userId,
    user_name: storedUser.userName,
    user_image_url: storedUser.userImageUrl,
    user_account: storedUser.userAccount,
    user_description: storedUser.userDescription,
    user_sns_facebook: storedUser.userSnsFacebook,
    user_sns_facebook_name: storedUser.userSnsFacebookName,
    user_sns_twitter: storedUser.userSnsTwitter,
    user_sns_instagram: storedUser.userSnsInstagram,
    user_sns_website: storedUser.userSnsWebsite,
    user_pass_code: storedUser.userPassCode,
    verified_at: storedUser.verifiedAt,
    created_at: storedUser.createdAt ? Timestamp.fromDate(storedUser.createdAt) : Timestamp.now(),
    updated_at: storedUser.updatedAt ? Timestamp.fromDate(storedUser.updatedAt) : Timestamp.now(),
  })
}

export const convertFirestoredUserToStoredUser = (
  firestoredUser: FirestoredUser,
  firestoredUserPersonalInformation: FirestoredUserPersonalInformation,
): StoredUser => {
  const {
    user_id,
    user_name,
    user_image_url,
    user_account,
    user_description,
    user_sns_facebook,
    user_sns_facebook_name,
    user_sns_twitter,
    user_sns_instagram,
    user_sns_website,
    user_pass_code,
    verified_at,
    created_at,
    updated_at,
  } = firestoredUser

  const { user_email, user_email_pending, user_sns_google, user_sns_twitter_access_token, user_sns_twitter_secret } =
    firestoredUserPersonalInformation

  return {
    userId: user_id,
    userName: user_name,
    userEmail: user_email,
    userEmailPending: user_email_pending || null,
    userImageUrl: user_image_url,
    userAccount: user_account,
    userDescription: user_description,
    userSnsGoogle: user_sns_google || null,
    userSnsFacebook: user_sns_facebook,
    userSnsFacebookName: user_sns_facebook_name,
    userSnsTwitter: user_sns_twitter,
    userSnsTwitterAccessToken: user_sns_twitter_access_token,
    userSnsTwitterSecret: user_sns_twitter_secret,
    userSnsInstagram: user_sns_instagram,
    userSnsWebsite: user_sns_website,
    userPassCode: user_pass_code,
    verifiedAt: verified_at?.toDate() || null,
    createdAt: created_at?.toDate(),
    updatedAt: updated_at?.toDate(),
  }
}

export const convertDocumentDataToStoredUser = (
  documentData: DocumentData,
  personalInfomationData: DocumentData,
): StoredUser => {
  const {
    user_id,
    user_name,
    user_image_url,
    user_account,
    user_description,
    user_sns_facebook,
    user_sns_facebook_name,
    user_sns_twitter,
    user_sns_instagram,
    user_sns_website,
    user_pass_code,
    verified_at,
    created_at,
    updated_at,
  } = documentData

  const { user_email, user_email_pending, user_sns_google, user_sns_twitter_access_token, user_sns_twitter_secret } =
    personalInfomationData

  return {
    userId: user_id ?? '',
    userName: user_name ?? '',
    userEmail: user_email ?? '',
    userEmailPending: user_email_pending ?? null,
    userImageUrl: user_image_url ?? null,
    userAccount: user_account ?? '',
    userDescription: user_description ?? '',
    userSnsGoogle: user_sns_google ?? '',
    userSnsFacebook: user_sns_facebook ?? '',
    userSnsFacebookName: user_sns_facebook_name ?? '',
    userSnsTwitter: user_sns_twitter ?? '',
    userSnsTwitterAccessToken: user_sns_twitter_access_token ?? '',
    userSnsTwitterSecret: user_sns_twitter_secret ?? '',
    userSnsInstagram: user_sns_instagram ?? '',
    userSnsWebsite: user_sns_website ?? '',
    userPassCode: user_pass_code ?? '',
    verifiedAt: verified_at ? (verified_at as Timestamp).toDate() : null,
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
