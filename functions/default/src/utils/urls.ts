import { defineString } from 'firebase-functions/params'
import * as common from '@shokujii/common/utils/urls.js'
import { getStorage } from 'firebase-admin/storage'
import { resolveEnterpriseAppHost } from './enterpriseBaseDomain.js'
import { getEnterpriseById } from '../stores/enterprise.js'

const EVENT_HOST = defineString('EVENT_HOST')
const PARTNER_HOST = defineString('PARTNER_HOST')

type CommunityHostSource = {
  community_account: string
  enterprise_id?: string | null
}

type EventHostSource = {
  community_account: string
  id: string
  enterprise_id?: string | null
}

export const getEventHost = (): string => EVENT_HOST.value()

/** SEO fetch 等で使う user サイト origin（末尾スラッシュなし）。EVENT_HOST 正本。 */
export const getEventSiteOrigin = (): string => `https://${EVENT_HOST.value()}`

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

/** community.enterprise_id からアプリ host（hostname のみ）を解決。PF は EVENT_HOST */
export async function resolveAppHostForCommunity(
  community: Pick<CommunityHostSource, 'enterprise_id'>,
): Promise<string | undefined> {
  const enterpriseId = community.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    return getEventHost()
  }
  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    return undefined
  }
  return resolveEnterpriseAppHost(enterprise)
}

export async function getCommunityUrlForCommunity(community: CommunityHostSource): Promise<string | undefined> {
  const host = await resolveAppHostForCommunity(community)
  if (host == null) {
    return undefined
  }
  return common.getCommunityUrl(host, community.community_account)
}

export async function getEventUrlForCommunity(
  community: CommunityHostSource,
  eventId: string,
): Promise<string | undefined> {
  const host = await resolveAppHostForCommunity(community)
  if (host == null) {
    return undefined
  }
  return common.getEventUrl(host, community.community_account, eventId)
}

export async function getManageCommunityUrlForCommunity(community: CommunityHostSource): Promise<string | undefined> {
  const host = await resolveAppHostForCommunity(community)
  if (host == null) {
    return undefined
  }
  return common.getManageCommunityUrl(host, community.community_account)
}

export async function getEventUrlForEvent(event: EventHostSource): Promise<string | undefined> {
  return getEventUrlForCommunity(event, event.id)
}

/** LINE 等の外部ブラウザ起動用クエリ付きイベント URL */
export const getEventUrlForExternalBrowser = (communityAccount: string, eventId: string): string =>
  `${getEventUrl(communityAccount, eventId)}?openExternalBrowser=1`

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
