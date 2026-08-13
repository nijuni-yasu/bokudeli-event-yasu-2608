/* eslint-disable @typescript-eslint/no-unused-vars -- build:types stub; signatures mirror app router/utils */
import type { RouteLocationRaw } from 'vue-router'

/** base 単体 build:types 用スタブ。実装は各アプリ src/router/utils.ts */
export const getUrlFromPath = (path: string): string => path
export const getHomePath = (): string => '/'
export const getCommunityListPath = (): string => '/communitylist'
export const getCommunityPath = (communityAccount: string): string => `/c/${communityAccount}`
export const getEventPath = (communityAccount: string, eventId: string): string => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string): string => `/u/${userId}`
export const getOrdersPath = (): string => '/orders'
export const getOrdersPathAfterOrder = (_params: { eventId: string; communityAccount: string }): RouteLocationRaw =>
  '/orders'
export const getChatPath = (roomId?: string): string => (roomId != null && roomId !== '' ? `/chat/${roomId}` : '/chat')
export const getReceiptPath = (eventId: string, stripeId: string): string =>
  `/receipt?eventId=${eventId}&stripeId=${stripeId}`
export const getEventCreatePath = (communityAccount: string): string => `/manage/community/${communityAccount}/newevent`
export const getEventEditPath = (eventId: string): string => `/manage/event/${eventId}/settings`
export const getEventEditBasicPath = (eventId: string): string => `/manage/event/${eventId}/settings?step=1`
export const getEventEditShopNoticePath = (eventId: string): string => `/manage/event/${eventId}/settings?step=5`
export const getEventEditDetailsPath = (eventId: string): string => `/manage/event/${eventId}/settings?step=4`
export const getEventEditPathByRawStatus = (eventId: string, _rawStatus: string): string =>
  `/manage/event/${eventId}/settings`
export const getManagePath = (): string => '/manage'
export const getManageNewCommunityPath = (): string => '/manage/newcommunity'
export const getManageCommunitySettingsPath = (communityAccount: string): string =>
  `/manage/community/${communityAccount}/settings`
export const getManageCommunityListPath = (): string => '/manage/community'
export const getManageEventListPath = (): string => '/manage/event'
export const getManageCommunityPath = (communityAccount: string): string => `/manage/community/${communityAccount}`
export const getManageCommunityAlbumPath = (communityAccount: string): string =>
  `/manage/community/${communityAccount}/album`
export const getManageCommunityInvoicePath = (communityAccount: string): string =>
  `/manage/community/${communityAccount}/invoice`
export const getManageEventPath = (eventId: string): string => `/manage/event/${eventId}`
export const getManageEventSettingsPath = (eventId: string): string => `/manage/event/${eventId}/settings`
export const getEventBillInvoicePath = (eventId: string): string => `/manage/event/${eventId}/invoice`
export const getFlyerPath = (): string => '/flyer'
export type PassCodeMode = 'login' | 'register'
export function parsePassCodeMode(_raw: unknown): PassCodeMode {
  return 'login'
}
export const getLogin = (): string => '/login'
export const getRegister = (): string => '/register'
export const getProfile = (_isNewUser: boolean = false): RouteLocationRaw => ({ path: '/profile' })
export const getPassCode = (_email: string, _mode: PassCodeMode = 'login'): RouteLocationRaw => ({ path: '/passcode' })
export const getRegisterComplete = (_isNewUser: boolean): RouteLocationRaw => ({ path: '/register/complete' })
