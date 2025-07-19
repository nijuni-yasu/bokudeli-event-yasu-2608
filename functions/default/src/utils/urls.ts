import { defineString } from 'firebase-functions/params'
import * as common from '@shokujii/common/utils/urls.js'

const EVENT_HOST = defineString('EVENT_HOST')
const ADMIN_HOST = defineString('ADMIN_HOST')

/*
 * User URLs
 */
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

export const getManageCommunityUrl = (communityAccount: string) =>
  common.getManageCommunityUrl(EVENT_HOST.value(), communityAccount)

/*
 * Admin URLs
 */
export const getAdminOrderUrl = (eventId: string) => common.getAdminOrderUrl(ADMIN_HOST.value(), eventId)
