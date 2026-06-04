import { defineString } from 'firebase-functions/params'
import * as common from '@shokujii/common/utils/urls.js'
import { getStorage } from 'firebase-admin/storage'

const EVENT_HOST = defineString('EVENT_HOST')
const PARTNER_HOST = defineString('PARTNER_HOST')

/*
 * Firebase Storage Base URL
 */
export const FIREBASE_STORAGE_BASE_URL = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/`
  : 'https://firebasestorage.googleapis.com/v0/'

export const convertStoragePathToURL = (path: string): string => {
  const bucket = getStorage().bucket().name
  return `${FIREBASE_STORAGE_BASE_URL}b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
}

/*
 * User URLs
 */
export const getMainUrl = () => `https://${EVENT_HOST.value()}/`

export const getCommunityUrl = (communityAccount: string) =>
  common.getCommunityUrl(EVENT_HOST.value(), communityAccount)

export const getEventUrl = (communityAccount: string, eventId: string) =>
  common.getEventUrl(EVENT_HOST.value(), communityAccount, eventId)

export const getUserUrl = (userId: string) => common.getUserUrl(EVENT_HOST.value(), userId)

export const getCommunityInvitationUrl = (communityAccount: string, tokenId: string) =>
  common.getCommunityInvitationUrl(EVENT_HOST.value(), communityAccount, tokenId)

/*
 * User Manage URLs
 */
export const getManageEventMemberUrl = (eventId: string) => common.getManageEventMemberUrl(EVENT_HOST.value(), eventId)

export const getManageEventInvoiceUrl = (eventId: string, invoiceId: string) =>
  common.getManageEventInvoiceUrl(EVENT_HOST.value(), eventId, invoiceId)

/**
 * Cloud Function の直リンクで請求書PDFを返す URL を生成する。
 * 認証不要でアクセスできるため、メール記載用に使用する。
 */
export const getEventBillInvoiceDirectUrl = (eventId: string, invoiceId: string) =>
  `https://asia-northeast1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/eventBillInvoice/${eventId}?id=${invoiceId}`

export const getManageCommunityUrl = (communityAccount: string) =>
  common.getManageCommunityUrl(EVENT_HOST.value(), communityAccount)

/*
 * Partner URLs
 */
export const getPartnerOrderUrl = (eventId: string) => common.getPartnerOrderUrl(PARTNER_HOST.value(), eventId)
