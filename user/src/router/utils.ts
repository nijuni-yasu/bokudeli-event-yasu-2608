export const getUrlFromPath = (path: string) => `https://${import.meta.env.VITE_ORIGIN_HOST}${path}`

export const getHomePath = () => '/'
export const getCommunityListPath = () => '/communitylist'
export const getCommunityPath = (communityAccount: string) => `/c/${communityAccount}`
export const getEventPath = (communityAccount: string, eventId: string) => `/c/${communityAccount}/e/${eventId}`
export const getUserPath = (userId: string) => `/u/${userId}`
export const getChatPath = (roomId?: string) => (roomId != null && roomId !== '' ? `/chat/${roomId}` : '/chat')
export const getReceiptPath = (eventId: string, stripeId: string) => `/receipt?eventId=${eventId}&stripeId=${stripeId}`
export const getEventCreatePath = (communityAccount: string) => `/manage/community/${communityAccount}/newevent`
export const getEventEditPath = (eventId: string) => `/manage/event/${eventId}/settings`
export const getEventEditBasicPath = (eventId: string) => `/manage/event/${eventId}/settings?step=1`
export const getEventEditShopNoticePath = (eventId: string) => `/manage/event/${eventId}/settings?step=5`
export const getEventEditDetailsPath = (eventId: string) => `/manage/event/${eventId}/settings?step=4`

/** DB 上の event_status.value に応じたイベント編集の初期ステップ（下書きは step=1、それ以外は step=4） */
export const getEventEditPathByRawStatus = (eventId: string, rawStatus: string) =>
  rawStatus === 'in_draft' ? getEventEditBasicPath(eventId) : getEventEditDetailsPath(eventId)
export const getManagePath = () => '/manage'
export const getManageNewCommunityPath = () => '/manage/newcommunity'
export const getManageCommunitySettingsPath = (communityAccount: string) =>
  `/manage/community/${communityAccount}/settings`
export const getManageCommunityListPath = () => '/manage/community'
export const getManageEventListPath = () => '/manage/event'
export const getManageCommunityPath = (communityAccount: string) => `/manage/community/${communityAccount}`
export const getManageCommunityAlbumPath = (communityAccount: string) => `/manage/community/${communityAccount}/album`
export const getManageCommunityInvoicePath = (communityAccount: string) =>
  `/manage/community/${communityAccount}/invoice`
// export const getManageEventListPath = (communityAccount: string) => `/manage/community/${communityAccount}/event`
export const getManageEventPath = (eventId: string) => `/manage/event/${eventId}`
export const getManageEventSettingsPath = (eventId: string) => `/manage/event/${eventId}/settings`
export const getEventBillInvoicePath = (eventId: string) => `/manage/event/${eventId}/invoice`
export const getFlyerPath = () => '/flyer'
export type PassCodeMode = 'login' | 'register'

export function parsePassCodeMode(raw: unknown): PassCodeMode {
  return raw === 'register' ? 'register' : 'login'
}

export const getLogin = () => '/login'
export const getRegister = () => '/register'
// ここでデフォルト設定はあまり使うべきではないが、互換性のために
export const getProfile = (isNewUser: boolean = false) => ({ path: '/profile', state: { isNewUser } })
export const getPassCode = (email: string, mode: PassCodeMode = 'login') => ({
  path: '/pass-code',
  state: { email, mode },
})
export const getRegisterComplete = (isNewUser: boolean) => ({ path: '/register/complete', state: { isNewUser } })
